"use client";

import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { seismicTestnet } from "@/lib/wagmi";
import { ensureCsrfToken, updateCsrfToken } from "@/lib/csrf";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";
const MANUAL_DISCONNECT_KEY = "seismic_signal_manual_disconnect";
const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS?.toLowerCase() || null;
axios.defaults.withCredentials = true;

let globalLoginInProgress = false;
const globalHasAttemptedLogin: { [key: string]: boolean } = {};
let globalSessionAddress: string | null = null;
const globalSessionListeners = new Set<(address: string | null) => void>();

function getManualDisconnectFlag() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MANUAL_DISCONNECT_KEY) === "true";
}

function setManualDisconnectFlag(value: boolean) {
  if (typeof window === "undefined") return;

  if (value) {
    window.localStorage.setItem(MANUAL_DISCONNECT_KEY, "true");
  } else {
    window.localStorage.removeItem(MANUAL_DISCONNECT_KEY);
  }
}

function setSharedSessionAddress(address: string | null) {
  globalSessionAddress = address;
  globalSessionListeners.forEach(listener => listener(address));
}

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const chainId = useChainId();

  const [sessionAddress, setSessionAddress] = useState<string | null>(globalSessionAddress);
  const [isAuthFetched, setIsAuthFetched] = useState(false);

  const { data: balance, error: balanceError } = useBalance({
    address,
    query: { 
      enabled: !!address,
      retry: 1,
    },
  });

  const { signMessageAsync } = useSignMessage();

  useEffect(() => {
    globalSessionListeners.add(setSessionAddress);
    return () => {
      globalSessionListeners.delete(setSessionAddress);
    };
  }, []);

  useEffect(() => {
    ensureCsrfToken().catch(() => null);

    axios.get(`${API_URL}/auth/me`)
      .then(res => {
        if (res.data?.success && res.data?.data?.address) {
          setSharedSessionAddress(res.data.data.address);
        }
      })
      .catch(() => setSharedSessionAddress(null))
      .finally(() => setIsAuthFetched(true));
  }, []);

  const login = useCallback(async () => {
    if (!address || !chainId || globalLoginInProgress) return;
    
    globalLoginInProgress = true;
    globalHasAttemptedLogin[address] = true;
    try {
      await ensureCsrfToken();
      const nonceRes = await axios.get(`${API_URL}/auth/nonce`, { withCredentials: true });
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Seismic Signal to verify your identity.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce: nonceRes.data,
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const verifyRes = await axios.post(`${API_URL}/auth/verify`, {
        message,
        signature,
      }, { withCredentials: true });

      if (verifyRes.data.success) {
        updateCsrfToken(verifyRes.data?.data?.csrfToken || null);
        setSharedSessionAddress(address);
        setManualDisconnectFlag(false);
      }
    } catch (e: any) {
      console.error("SIWE Login failed or cancelled:", e.message || e);
      globalHasAttemptedLogin[address] = false;
      setSharedSessionAddress(null);
    } finally {
      globalLoginInProgress = false;
    }
  }, [address, chainId, signMessageAsync]);

  const prepareForConnect = useCallback(() => {
    setManualDisconnectFlag(false);

    if (address) {
      globalHasAttemptedLogin[address] = false;
    }
  }, [address]);

  const logout = useCallback(async () => {
    setManualDisconnectFlag(true);

    try {
      await ensureCsrfToken();
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout err", e);
    } finally {
      updateCsrfToken(null);
      setSharedSessionAddress(null);
      if (address) globalHasAttemptedLogin[address] = false;
      wagmiDisconnect();
    }
  }, [address, wagmiDisconnect]);

  const sessionMatchesWallet = !!(
    address &&
    sessionAddress &&
    sessionAddress.toLowerCase() === address.toLowerCase()
  );

  useEffect(() => {
    if (!isAuthFetched) return;

    if (isConnected && getManualDisconnectFlag()) {
      wagmiDisconnect();
      return;
    }

    if (!isConnected || !address) {
      return;
    }

    if (sessionMatchesWallet) {
      globalHasAttemptedLogin[address] = true;
      return;
    }

    if (!globalHasAttemptedLogin[address]) {
      login();
    }
  }, [isConnected, address, isAuthFetched, sessionMatchesWallet, wagmiDisconnect, login]);

  const isWrongNetwork = isConnected && chainId !== seismicTestnet.id;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const formattedBalance = balance
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : balanceError
    ? "--- ETH"
    : null;

  const isAdmin = !!(
    address &&
    ADMIN_WALLET_ADDRESS &&
    address.toLowerCase() === ADMIN_WALLET_ADDRESS
  );

  return {
    address,
    shortAddress,
    isConnected,
    isConnecting: isConnecting || isPending,
    isWrongNetwork,
    balance: formattedBalance,
    connect,
    prepareForConnect,
    disconnect: logout,
    connectors,
    user: sessionMatchesWallet ? { address } : null,
    login,
    isLoggedIn: sessionMatchesWallet,
    isAdmin,
  };
}
