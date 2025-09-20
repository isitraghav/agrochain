import { useState } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { AddressQRModal } from './address-qr-modal';

export function WalletConnect() {
  const {
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
    chainId,
    isNetworkSupported,
    networkName
  } = useWeb3();

  const [showQRModal, setShowQRModal] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1337:
        return 'Localhost';
      case 31337:
        return 'Hardhat';
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia';
      default:
        return `Chain ${chainId}`;
    }
  };

  if (isConnected && account) {
    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-4 p-4 rounded-lg border ${
          isNetworkSupported
            ? 'bg-green-50 border-green-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex-1">
            <div className={`font-medium ${
              isNetworkSupported ? 'text-green-800' : 'text-orange-800'
            }`}>
              Connected:
              <button
                onClick={() => setShowQRModal(true)}
                className={`ml-1 hover:underline transition-colors ${
                  isNetworkSupported
                    ? 'text-green-700 hover:text-green-900'
                    : 'text-orange-700 hover:text-orange-900'
                }`}
                title="Click to show QR code"
              >
                {formatAddress(account)}
              </button>
            </div>
            {chainId && networkName && (
              <div className={`text-sm ${
                isNetworkSupported ? 'text-green-600' : 'text-orange-600'
              }`}>
                Network: {networkName} (Chain ID: {chainId})
                {!isNetworkSupported && (
                  <span className="ml-2 font-medium">⚠️ Unsupported</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>

        {!isNetworkSupported && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Network Not Supported</h4>
            <p className="text-sm text-orange-700 mb-3">
              Please switch to one of the supported networks:
            </p>
            <ul className="text-sm text-orange-700 list-disc list-inside space-y-1">
              <li>Hardhat Network (Chain ID: 31337)</li>
              <li>Localhost Network (Chain ID: 1337)</li>
            </ul>
            <p className="text-sm text-orange-600 mt-2">
              Use MetaMask to switch networks or check your local blockchain setup.
            </p>
          </div>
        )}

        <AddressQRModal
          address={account}
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connect your wallet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Connect MetaMask to interact with the BatchTracker contract
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={connectWallet}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Connect MetaMask'}
        </button>
      </div>
    </div>
  );
}