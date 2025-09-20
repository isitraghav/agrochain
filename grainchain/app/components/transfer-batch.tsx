import { useState } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { transferBatch, type BatchInfo } from '../lib/contract';
import { QRCodeScanner } from './qr-code-scanner';

interface TransferBatchProps {
  batch: BatchInfo | null;
  onClose: () => void;
  onTransferComplete: () => void;
}

export function TransferBatch({ batch, onClose, onTransferComplete }: TransferBatchProps) {
  const { signer } = useWeb3();
  const [newOwner, setNewOwner] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'manual' | 'scan'>('manual');

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !batch) return;

    try {
      setIsTransferring(true);
      setError(null);

      if (!newOwner.trim()) {
        throw new Error('Please enter a valid address');
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(newOwner.trim())) {
        throw new Error('Please enter a valid Ethereum address');
      }

      await transferBatch(signer, batch.batchId, newOwner.trim());

      onTransferComplete();
      onClose();
      setNewOwner('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer batch');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    setNewOwner('');
    setError(null);
    setInputMode('manual');
    onClose();
  };

  const handleQRScan = (scannedData: string) => {
    // Extract Ethereum address from scanned data
    let address = scannedData.trim();

    // If the scanned data contains an Ethereum address, extract it
    const ethAddressMatch = address.match(/0x[a-fA-F0-9]{40}/);
    if (ethAddressMatch) {
      address = ethAddressMatch[0];
    }

    // Validate the address
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setNewOwner(address);
      setInputMode('manual');
      setError(null);
    } else {
      setError('Scanned QR code does not contain a valid Ethereum address');
    }
  };

  const handleQRError = (error: string) => {
    setError(`QR Scanner Error: ${error}`);
    setInputMode('manual');
  };

  if (!batch) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Transfer Batch #{batch.batchId}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current Owner:</span> {batch.currentOwner}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Total Owners:</span> {batch.ownerCount}
          </p>
        </div>

        <form onSubmit={handleTransfer}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="newOwner" className="block text-sm font-medium text-gray-700">
                New Owner Address
              </label>
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    inputMode === 'manual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('scan')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    inputMode === 'scan'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Scan QR
                </button>
              </div>
            </div>

            {inputMode === 'manual' ? (
              <div>
                <input
                  type="text"
                  id="newOwner"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Ethereum address of the new owner
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-md p-4">
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>Note:</strong> Camera access is required for QR scanning. Make sure to allow camera permissions when prompted.
                </div>
                <QRCodeScanner
                  onScan={handleQRScan}
                  onError={handleQRError}
                  onClose={() => setInputMode('manual')}
                />
                {newOwner && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Scanned address:</span> {newOwner}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTransferring}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTransferring ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}