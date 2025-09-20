import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ethers } from 'ethers';
import { getNetworkName } from '../config/contracts';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
  error: string | null;
  isNetworkSupported: boolean;
  networkName: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkSupported, setIsNetworkSupported] = useState(false);
  const [networkName, setNetworkName] = useState<string | null>(null);

  // Helper function to check if network is supported
  const checkNetworkSupport = (chainId: number) => {
    const supportedChainIds = [1337, 31337]; // localhost and hardhat
    return supportedChainIds.includes(chainId);
  };

  // Helper function to update network info
  const updateNetworkInfo = (chainId: number) => {
    setChainId(chainId);
    setIsNetworkSupported(checkNetworkSupport(chainId));
    setNetworkName(getNetworkName(chainId));
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      updateNetworkInfo(chainId);
      setIsConnected(true);

      // Check if network is supported and warn user if not
      if (!checkNetworkSupport(chainId)) {
        setError(`Unsupported network: ${getNetworkName(chainId)} (${chainId}). Please switch to Hardhat (31337) or Localhost (1337).`);
      }

      localStorage.setItem('walletConnected', 'true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setIsNetworkSupported(false);
    setNetworkName(null);
    setError(null);
    localStorage.removeItem('walletConnected');
  };

  const checkConnection = async () => {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0 && localStorage.getItem('walletConnected')) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0].address);
        updateNetworkInfo(chainId);
        setIsConnected(true);

        // Check if network is supported
        if (!checkNetworkSupport(chainId)) {
          setError(`Unsupported network: ${getNetworkName(chainId)} (${chainId}). Please switch to Hardhat (31337) or Localhost (1337).`);
        }
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
    }
  };

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        updateNetworkInfo(newChainId);

        // Check if new network is supported
        if (!checkNetworkSupport(newChainId)) {
          setError(`Unsupported network: ${getNetworkName(newChainId)} (${newChainId}). Please switch to Hardhat (31337) or Localhost (1337).`);
        } else {
          setError(null); // Clear error if network is now supported
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        isConnected,
        chainId,
        connectWallet,
        disconnectWallet,
        isLoading,
        error,
        isNetworkSupported,
        networkName,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}