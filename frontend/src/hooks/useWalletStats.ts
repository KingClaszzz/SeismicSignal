import { useState, useCallback } from 'react';
import { formatUnits } from 'viem';
import { createPublicClient, http } from 'viem';
import { seismicTestnet } from '@/lib/wagmi';

const ARSEI_ADDRESS = (process.env.NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const SUSD_ADDRESS = (process.env.NEXT_PUBLIC_SUSD_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

const publicClient = createPublicClient({
  chain: seismicTestnet,
  transport: http()
});

export interface WalletTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  symbol: string;
  blockNumber: bigint;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useWalletStats() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    arsei: string;
    susd: string;
    txs: WalletTx[];
  } | null>(null);

  const fetchStats = useCallback(async (address: string) => {
    if (!address.startsWith('0x')) return;
    const addr = address as `0x${string}`;
    
    setLoading(true);
    try {
      const [arseiBalance, susdBalance] = await Promise.all([
        publicClient.readContract({
          address: ARSEI_ADDRESS,
          abi: [{ name: 'balanceOf', type: 'function', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
          functionName: 'balanceOf',
          args: [addr]
        }).catch(() => 0n),
        publicClient.readContract({
          address: SUSD_ADDRESS,
          abi: [{ name: 'balanceOf', type: 'function', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }],
          functionName: 'balanceOf',
          args: [addr]
        }).catch(() => 0n)
      ]);

      const historyRes = await fetch(`${API_URL}/api/user/${address}/history`);
      const historyData = await historyRes.json();
      
      let txs: WalletTx[] = [];
      if (historyData.success && Array.isArray(historyData.data)) {
        txs = historyData.data.slice(0, 5).map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: formatUnits(BigInt(tx.value || 0), Number(tx.tokenDecimal || 6)),
          symbol: (tx.tokenSymbol || "").toUpperCase(),
          blockNumber: BigInt(tx.blockNumber || 0)
        }));
      }

      setData({
        arsei: formatUnits(arseiBalance as bigint, 18),
        susd: formatUnits(susdBalance as bigint, 18),
        txs
      });
    } catch (err) {
      console.error('Fetch wallet stats failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchStats, loading, data };
}
