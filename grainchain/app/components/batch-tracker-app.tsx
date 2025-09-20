import { useState } from 'react';
import { WalletConnect } from './wallet-connect';
import { CreateBatchForm } from './create-batch-form';
import { BatchList } from './batch-list';
import { TransferBatch } from './transfer-batch';
import { BatchInfoModal } from './batch-info-modal';
import { NetworkDiagnostics } from './network-diagnostics';
import { useWeb3 } from '../lib/web3-context';
import { type BatchInfo } from '../lib/contract';

export function BatchTrackerApp() {
  const { isConnected } = useWeb3();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedBatchForTransfer, setSelectedBatchForTransfer] = useState<BatchInfo | null>(null);
  const [selectedBatchForInfo, setSelectedBatchForInfo] = useState<BatchInfo | null>(null);

  const handleBatchCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTransferComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTransferClick = (batch: BatchInfo) => {
    setSelectedBatchForTransfer(batch);
  };

  const handleTransferClose = () => {
    setSelectedBatchForTransfer(null);
  };

  const handleBatchClick = (batch: BatchInfo) => {
    setSelectedBatchForInfo(batch);
  };

  const handleBatchInfoClose = () => {
    setSelectedBatchForInfo(null);
  };

  const handleTransferFromInfo = (batch: BatchInfo) => {
    setSelectedBatchForTransfer(batch);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AgroChain</h1>
          <p className="mt-2 text-lg text-gray-600">
            Create, manage, and transfer batch ownership on the blockchain
          </p>
        </div>

        <div className="space-y-8">
          <WalletConnect />

          {/* {isConnected && (
            <NetworkDiagnostics />
          )} */}

          <div className=" flex flex-col gap-4">
            <CreateBatchForm onBatchCreated={handleBatchCreated} />
            <BatchList
              refreshTrigger={refreshTrigger}
              onTransferClick={handleTransferClick}
              onBatchClick={handleBatchClick}
            />
          </div>
        </div>

        <BatchInfoModal
          batch={selectedBatchForInfo}
          onClose={handleBatchInfoClose}
          onTransferClick={handleTransferFromInfo}
        />

        <TransferBatch
          batch={selectedBatchForTransfer}
          onClose={handleTransferClose}
          onTransferComplete={handleTransferComplete}
        />
      </div>
    </div>
  );
}