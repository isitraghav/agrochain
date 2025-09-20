import { useParams, useNavigate, useSearchParams } from 'react-router';
import type { Route } from './+types/batch.info.$id';
import { BatchDetailView } from '../components/batch-detail-view';
import { TransferBatch } from '../components/transfer-batch';
import { useState, useEffect } from 'react';
import type { BatchInfo } from '../lib/contract';

export function meta({ params }: Route.MetaArgs) {
  const batchId = params.id;
  return [
    { title: `Batch #${batchId} - AgroChain` },
    { name: "description", content: `Detailed information for batch #${batchId} on the AgroChain blockchain tracking system` },
    { property: "og:title", content: `Batch #${batchId} - AgroChain` },
    { property: "og:description", content: `View the complete ownership history and details for batch #${batchId}` },
    { property: "og:type", content: "website" },
  ];
}

export default function BatchInfoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedBatchForTransfer, setSelectedBatchForTransfer] = useState<BatchInfo | null>(null);
  const [showWalletRequired, setShowWalletRequired] = useState(false);
  const [showPublicNotice, setShowPublicNotice] = useState(false);

  const batchId = parseInt(id || '0', 10);
  const isPublicView = searchParams.get('view') === 'public';
  const sharedBatchName = searchParams.get('name');

  useEffect(() => {
    // Show public notice if this is a shared link
    if (isPublicView) {
      setShowPublicNotice(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowPublicNotice(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isPublicView]);

  if (!id || isNaN(batchId) || batchId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Batch ID</h1>
            <p className="text-gray-600 mb-6">
              The batch ID "{id}" is not valid. Please check the URL and try again.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleTransferClick = (batch: BatchInfo) => {
    // Check if user has wallet connected before allowing transfer
    const provider = (window as any).ethereum;
    if (!provider) {
      setShowWalletRequired(true);
      return;
    }
    setSelectedBatchForTransfer(batch);
  };

  const handleTransferClose = () => {
    setSelectedBatchForTransfer(null);
  };

  const handleTransferComplete = () => {
    setSelectedBatchForTransfer(null);
    // The batch detail view will automatically refresh when the blockchain state changes
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Public View Notice */}
        {showPublicNotice && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  {sharedBatchName ? `Viewing "${decodeURIComponent(sharedBatchName)}"` : 'Viewing Shared Batch'}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  You can view all batch information without connecting a wallet. To transfer ownership, you'll need MetaMask.
                </p>
              </div>
              <button
                onClick={() => setShowPublicNotice(false)}
                className="ml-3 text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header with navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Batch Detail View */}
        <BatchDetailView
          batchId={batchId}
          onTransferClick={handleTransferClick}
          showTransferButton={true}
          showOwnershipBadge={true}
        />

        {/* Transfer Modal */}
        <TransferBatch
          batch={selectedBatchForTransfer}
          onClose={handleTransferClose}
          onTransferComplete={handleTransferComplete}
        />

        {/* Wallet Required Modal */}
        {showWalletRequired && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Connection Required</h3>
                <p className="text-gray-600 mb-6">
                  To transfer batch ownership, you need to connect your MetaMask wallet. You can view batch information without connecting.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWalletRequired(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Continue Viewing
                  </button>
                  <button
                    onClick={() => {
                      setShowWalletRequired(false);
                      navigate('/');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}