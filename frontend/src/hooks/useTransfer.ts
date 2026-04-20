import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useEffect, useState } from 'react';

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  ARSEI: (process.env.NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  SUSD: (process.env.NEXT_PUBLIC_SUSD_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

export function useTransfer() {
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = async (symbol: string, amount: string, to: `0x${string}`) => {
    const address = TOKEN_ADDRESSES[symbol.toUpperCase()];
    if (!address || /^0x0+$/.test(address)) throw new Error(`Unsupported or unconfigured token: ${symbol}`);

    setStatus('pending');
    writeContract({
      address,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, parseUnits(amount, 18)],
    });
  };

  useEffect(() => {
    if (isSuccess) setStatus('success');
    if (error) setStatus('error');
  }, [isSuccess, error]);

  return {
    transfer,
    hash,
    error,
    isPending: isPending || isWaiting,
    isSuccess,
    status
  };
}
