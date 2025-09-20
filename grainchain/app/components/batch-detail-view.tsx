import { useState, useEffect } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { getOwnerHistory, getBatchInfoWithMetadata, getProviderWithFallback, type BatchInfo } from '../lib/contract';
import { pinataService } from '../lib/pinata';
import type { BatchMetadata } from '../types/batch';

interface BatchDetailViewProps {
  batchId: number;
  onTransferClick?: (batch: BatchInfo) => void;
  showTransferButton?: boolean;
  showOwnershipBadge?: boolean;
}

interface OwnerHistoryEntry {
  address: string;
  order: number;
  isFirst: boolean;
  isCurrent: boolean;
}

export function BatchDetailView({
  batchId,
  onTransferClick,
  showTransferButton = true,
  showOwnershipBadge = true
}: BatchDetailViewProps) {
  const { provider, account } = useWeb3();
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [ownerHistory, setOwnerHistory] = useState<OwnerHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        // Use connected provider or fallback to public provider
        const activeProvider = getProviderWithFallback(provider);

        setIsLoading(true);
        setError(null);
        setImageError(false);

        // Fetch ownership history
        const history = await getOwnerHistory(activeProvider, batchId);

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
        const enrichedBatchInfo = await getBatchInfoWithMetadata(activeProvider, batchId);
        setBatch(enrichedBatchInfo);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load batch information');
      } finally {
        setIsLoading(false);
        setIsLoadingMetadata(false);
      }
    };

    fetchBatchData();
  }, [batchId, provider]);

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
  const metadata = batch?.metadata as BatchMetadata | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Batch</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Batch Not Found</h3>
        <p className="text-gray-600">Batch #{batchId} could not be found or does not exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Batch #{batch.batchId}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {showOwnershipBadge && isOwner && (
                <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                  You Own This
                </span>
              )}
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {batch.ownerCount} Owner{batch.ownerCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {showTransferButton && isOwner && onTransferClick && (
            <button
              onClick={() => onTransferClick(batch)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Transfer Batch
            </button>
          )}
        </div>
      </div>

      {/* Batch Image and Basic Info */}
      {metadata && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image */}
            {metadata.image && !imageError && (
              <div className="flex-shrink-0">
                <div className="w-64 h-64 bg-gray-100 rounded-lg overflow-hidden">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{metadata.name}</h2>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">{metadata.description}</p>

              {/* Quick metadata display */}
              {metadata.batch_properties && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metadata.batch_properties.origin && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">🌍 Origin:</span>
                      <span className="font-medium text-lg">{metadata.batch_properties.origin}</span>
                    </div>
                  )}
                  {metadata.batch_properties.quality_grade && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">⭐ Grade:</span>
                      <span className="font-medium text-lg">{metadata.batch_properties.quality_grade}</span>
                    </div>
                  )}
                  {metadata.batch_properties.weight && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">⚖️ Weight:</span>
                      <span className="font-medium text-lg">{metadata.batch_properties.weight}</span>
                    </div>
                  )}
                  {metadata.batch_properties.harvest_date && (
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">📅 Harvest:</span>
                      <span className="font-medium text-lg">{new Date(metadata.batch_properties.harvest_date).toLocaleDateString()}</span>
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Loading metadata from IPFS...</span>
          </div>
        </div>
      )}

      {/* No metadata indicator */}
      {!isLoadingMetadata && !metadata && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-600">
            📝 No additional metadata found for this batch. It may have been created before metadata support was added.
          </p>
        </div>
      )}

      {/* Blockchain Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Batch ID</span>
            <span className="text-lg text-gray-900">#{batch.batchId}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Current Owner</span>
            <span className="text-lg text-gray-900 font-mono">{formatAddress(batch.currentOwner)}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Total Owners</span>
            <span className="text-lg text-gray-900">{batch.ownerCount}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Created</span>
            <span className="text-lg text-gray-900">{formatDate(batch.createdAt)}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Last Transfer</span>
            <span className="text-lg text-gray-900">{formatDate(batch.lastTransferAt)}</span>
          </div>
          {batch.ipfsHash && (
            <div className="bg-gray-50 rounded-lg p-4">
              <span className="block text-sm font-medium text-gray-700 mb-1">IPFS Hash</span>
              <span className="text-sm text-gray-900 font-mono break-all">{batch.ipfsHash}</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metadata */}
      {metadata && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Information</h3>

          {/* Properties */}
          {metadata.batch_properties && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Batch Properties</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(metadata.batch_properties).map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;

                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="col-span-full">
                        <span className="block font-medium text-gray-700 mb-2">{displayKey}:</span>
                        <div className="flex flex-wrap gap-2">
                          {value.map((item, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3">
                      <span className="block text-sm font-medium text-gray-700 mb-1">{displayKey}</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Attributes */}
          {metadata.attributes && metadata.attributes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Custom Attributes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metadata.attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <span className="block text-sm font-medium text-gray-700 mb-1">{attr.trait_type}</span>
                    <span className="text-gray-900">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External URL */}
          {metadata.external_url && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">External Link</h4>
              <a
                href={metadata.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
              >
                {metadata.external_url}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Ownership History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Ownership History</h3>

        <div className="space-y-4">
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
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    entry.isCurrent
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {entry.order}
                  </div>
                  <div>
                    <div className="font-mono text-gray-900">
                      {entry.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatAddress(entry.address)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.isFirst && (
                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                      Creator
                    </span>
                  )}
                  {entry.isCurrent && (
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                      Current Owner
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}