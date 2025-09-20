import { useState, useEffect } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { getUserOwnedBatches, getBatchInfoWithMetadata, type BatchInfo } from '../lib/contract';
import type { BatchMetadata } from '../types/batch';

interface BatchListProps {
  refreshTrigger: number;
  onTransferClick: (batch: BatchInfo) => void;
  onBatchClick: (batch: BatchInfo) => void;
}

export function BatchList({ refreshTrigger, onTransferClick, onBatchClick }: BatchListProps) {
  const { provider, account, isConnected } = useWeb3();
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [enrichedBatches, setEnrichedBatches] = useState<BatchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    if (!provider || !account) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // First, get basic batch info
      const ownedBatches = await getUserOwnedBatches(provider, account);
      setBatches(ownedBatches);
      
      // Then, enrich with metadata
      setIsLoadingMetadata(true);
      const enriched = await Promise.all(
        ownedBatches.map(async (batch) => {
          try {
            return await getBatchInfoWithMetadata(provider, batch.batchId);
          } catch (error) {
            console.warn(`Failed to load metadata for batch ${batch.batchId}:`, error);
            return batch; // Return original batch if metadata fails
          }
        })
      );
      
      setEnrichedBatches(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batches');
    } finally {
      setIsLoading(false);
      setIsLoadingMetadata(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadBatches();
    }
  }, [provider, account, isConnected, refreshTrigger]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getBatchDisplayName = (batch: BatchInfo): string => {
    const metadata = batch.metadata as BatchMetadata | undefined;
    if (metadata?.name) {
      return metadata.name;
    }
    return `Batch #${batch.batchId}`;
  };

  const getBatchDescription = (batch: BatchInfo): string | null => {
    const metadata = batch.metadata as BatchMetadata | undefined;
    return metadata?.description || null;
  };

  // Use enriched batches if available, otherwise fall back to basic batches
  const displayBatches = enrichedBatches.length > 0 ? enrichedBatches : batches;

  if (!isConnected) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please connect your wallet to view your batches.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Batches</h2>
        <div className="flex items-center gap-2">
          {isLoadingMetadata && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              Loading metadata...
            </div>
          )}
          <button
            onClick={loadBatches}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {batches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You don't own any batches yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create your first batch to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayBatches.map((batch) => (
            <div
              key={batch.batchId}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => onBatchClick(batch)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {getBatchDisplayName(batch)}
                    </h3>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Owner
                    </span>
                    <span className="text-xs text-gray-400 italic">Click for details</span>
                  </div>

                  {/* Show description if available */}
                  {getBatchDescription(batch) && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {getBatchDescription(batch)}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Batch ID:</span>{' '}
                      #{batch.batchId}
                    </div>
                    <div>
                      <span className="font-medium">Total Owners:</span>{' '}
                      {batch.ownerCount}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {formatDate(batch.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Last Transfer:</span>{' '}
                      {formatDate(batch.lastTransferAt)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTransferClick(batch);
                  }}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}