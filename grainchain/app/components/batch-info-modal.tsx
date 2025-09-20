import { useState, useEffect } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { getOwnerHistory, getBatchInfoWithMetadata, type BatchInfo } from '../lib/contract';
import { pinataService } from '../lib/pinata';
import type { BatchMetadata } from '../types/batch';

interface BatchInfoModalProps {
  batch: BatchInfo | null;
  onClose: () => void;
  onTransferClick: (batch: BatchInfo) => void;
}

interface OwnerHistoryEntry {
  address: string;
  order: number;
  isFirst: boolean;
  isCurrent: boolean;
}

export function BatchInfoModal({ batch, onClose, onTransferClick }: BatchInfoModalProps) {
  const { provider, account } = useWeb3();
  const [ownerHistory, setOwnerHistory] = useState<OwnerHistoryEntry[]>([]);
  const [enrichedBatch, setEnrichedBatch] = useState<BatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!batch || !provider) return;

      try {
        setIsLoading(true);
        setError(null);
        setImageError(false);

        // Fetch ownership history
        const history = await getOwnerHistory(provider, batch.batchId);

        // Create history entries with metadata
        const historyEntries: OwnerHistoryEntry[] = history.map((address, index) => ({
          address,
          order: index + 1,
          isFirst: index === 0,
          isCurrent: index === history.length - 1
        }));

        setOwnerHistory(historyEntries);

        // Fetch enriched batch info with metadata
        setIsLoadingMetadata(true);
        const enrichedBatchInfo = await getBatchInfoWithMetadata(provider, batch.batchId);
        setEnrichedBatch(enrichedBatchInfo);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load batch information');
      } finally {
        setIsLoading(false);
        setIsLoadingMetadata(false);
      }
    };

    if (batch) {
      fetchBatchData();
    }
  }, [batch, provider]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUrl = (metadata: BatchMetadata): string | null => {
    if (metadata.image) {
      // If image is already a full URL, use it
      if (metadata.image.startsWith('http')) {
        return metadata.image;
      }
      // If it's an IPFS hash, construct the gateway URL
      if (metadata.image.startsWith('ipfs://')) {
        const hash = metadata.image.replace('ipfs://', '');
        return pinataService.getImageUrl(hash);
      }
      // If it's just a hash
      return pinataService.getImageUrl(metadata.image);
    }
    return null;
  };

  const isOwner = batch && account && batch.currentOwner.toLowerCase() === account.toLowerCase();
  const currentBatch = enrichedBatch || batch;
  const metadata = enrichedBatch?.metadata as BatchMetadata | undefined;

  if (!batch) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Batch #{batch.batchId}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {isOwner && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    You Own This
                  </span>
                )}
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {batch.ownerCount} Owner{batch.ownerCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Batch Image and Basic Info */}
          {metadata && (
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                {metadata.image && !imageError && (
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(metadata) || ''}
                        alt={metadata.name}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                  </div>
                )}
                
                {/* Metadata Info */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{metadata.name}</h3>
                  <p className="text-gray-700 mb-4">{metadata.description}</p>
                  
                  {/* Quick metadata display */}
                  {metadata.batch_properties && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {metadata.batch_properties.origin && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">🌍 Origin:</span>
                          <span className="font-medium">{metadata.batch_properties.origin}</span>
                        </div>
                      )}
                      {metadata.batch_properties.quality_grade && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">⭐ Grade:</span>
                          <span className="font-medium">{metadata.batch_properties.quality_grade}</span>
                        </div>
                      )}
                      {metadata.batch_properties.weight && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">⚖️ Weight:</span>
                          <span className="font-medium">{metadata.batch_properties.weight}</span>
                        </div>
                      )}
                      {metadata.batch_properties.harvest_date && (
                        <div className="flex items-center text-sm">
                          <span className="text-gray-500 mr-2">📅 Harvest:</span>
                          <span className="font-medium">{new Date(metadata.batch_properties.harvest_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading metadata indicator */}
          {isLoadingMetadata && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800 text-sm">Loading metadata from IPFS...</span>
              </div>
            </div>
          )}

          {/* No metadata indicator */}
          {!isLoadingMetadata && !metadata && currentBatch && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-600 text-sm">
                📝 No additional metadata found for this batch. It may have been created before metadata support was added.
              </p>
            </div>
          )}
          {/* Batch Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Blockchain Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Batch ID:</span>
                <span className="text-gray-900">#{currentBatch?.batchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Current Owner:</span>
                <span className="text-gray-900 font-mono">{formatAddress(currentBatch?.currentOwner || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Total Owners:</span>
                <span className="text-gray-900">{currentBatch?.ownerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Created:</span>
                <span className="text-gray-900">{formatDate(currentBatch?.createdAt || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Last Transfer:</span>
                <span className="text-gray-900">{formatDate(currentBatch?.lastTransferAt || 0)}</span>
              </div>
              {currentBatch?.ipfsHash && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">IPFS Hash:</span>
                  <span className="text-gray-900 font-mono text-xs">{currentBatch.ipfsHash.slice(0, 20)}...</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Metadata */}
          {metadata && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Information</h3>
              
              {/* Properties */}
              {metadata.batch_properties && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Batch Properties</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {Object.entries(metadata.batch_properties).map(([key, value]) => {
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;
                      
                      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      
                      if (Array.isArray(value)) {
                        return (
                          <div key={key} className="col-span-2">
                            <span className="font-medium text-gray-700">{displayKey}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {value.map((item, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={key}>
                          <span className="font-medium text-gray-700">{displayKey}:</span>
                          <span className="ml-2 text-gray-900">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Attributes */}
              {metadata.attributes && metadata.attributes.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Custom Attributes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {metadata.attributes.map((attr, index) => (
                      <div key={index}>
                        <span className="font-medium text-gray-700">{attr.trait_type}:</span>
                        <span className="ml-2 text-gray-900">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External URL */}
              {metadata.external_url && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">External Link</h4>
                  <a
                    href={metadata.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    {metadata.external_url}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Ownership History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ownership History</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading ownership history...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ownerHistory.map((entry) => (
                  <div
                    key={`${entry.address}-${entry.order}`}
                    className={`p-4 rounded-lg border-2 ${
                      entry.isCurrent
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          entry.isCurrent
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.order}
                        </div>
                        <div>
                          <div className="font-mono text-sm text-gray-900">
                            {entry.address}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatAddress(entry.address)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.isFirst && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Creator
                          </span>
                        )}
                        {entry.isCurrent && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Current Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            {isOwner && (
              <button
                onClick={() => {
                  onTransferClick(currentBatch!);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Transfer Batch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}