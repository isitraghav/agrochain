import { useState } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { createBatch } from '../lib/contract';

interface CreateBatchProps {
  onBatchCreated: () => void;
}

export function CreateBatch({ onBatchCreated }: CreateBatchProps) {
  const { signer, isConnected } = useWeb3();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateBatch = async () => {
    if (!signer) {
      setError('No wallet connected. Please connect your wallet first.');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setSuccess(null);

      console.log('Starting batch creation process...');
      const batchId = await createBatch(signer);

      setSuccess(`🎉 Batch #${batchId} created successfully!`);
      onBatchCreated();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Create batch failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create batch';
      setError(errorMessage);

      // Auto-clear error after 10 seconds for user convenience
      setTimeout(() => setError(null), 10000);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please connect your wallet to create batches.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Batch</h2>

      <p className="text-gray-600 mb-6">
        Create a new batch that will be owned by your wallet address. You can transfer ownership later.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <button
        onClick={handleCreateBatch}
        disabled={isCreating}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? 'Creating Batch...' : 'Create Batch'}
      </button>
    </div>
  );
}