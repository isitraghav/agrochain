import { useState } from 'react';
import { QRCodeGenerator } from './qr-code-generator';

interface AddressQRModalProps {
  address: string;
  onClose: () => void;
  isOpen: boolean;
}

export function AddressQRModal({ address, onClose, isOpen }: AddressQRModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Your Wallet Address</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Share this QR code or address to receive transfers</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-100">
              <QRCodeGenerator value={address} size={200} />
            </div>
          </div>

          {/* Address Display */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm break-all">
                  {address}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Address
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md font-mono text-sm text-gray-600">
                {formatAddress(address)}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share the QR code for others to scan</li>
              <li>• Copy the address to share via text</li>
              <li>• Others can transfer batches to this address</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}