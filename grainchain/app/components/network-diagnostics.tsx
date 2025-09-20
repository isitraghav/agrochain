import { useState, useEffect } from 'react';
import { useWeb3 } from '../lib/web3-context';
import { getContractConfig, getNetworkName } from '../config/contracts';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'checking';
  message: string;
}

export function NetworkDiagnostics() {
  const { provider, signer, account, chainId, isConnected } = useWeb3();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    if (!isConnected || !provider || !signer) {
      return;
    }

    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Network Connection
    try {
      await provider.getNetwork();
      results.push({
        name: 'Network Connection',
        status: 'success',
        message: 'Connected to blockchain network'
      });
    } catch (error) {
      results.push({
        name: 'Network Connection',
        status: 'error',
        message: 'Failed to connect to network'
      });
    }

    // Test 2: Account Balance
    try {
      const balance = await provider.getBalance(account!);
      const balanceEth = parseFloat(balance.toString()) / 1e18;
      if (balanceEth > 0.01) {
        results.push({
          name: 'Account Balance',
          status: 'success',
          message: `Balance: ${balanceEth.toFixed(4)} ETH`
        });
      } else {
        results.push({
          name: 'Account Balance',
          status: 'warning',
          message: `Low balance: ${balanceEth.toFixed(4)} ETH`
        });
      }
    } catch (error) {
      results.push({
        name: 'Account Balance',
        status: 'error',
        message: 'Failed to check balance'
      });
    }

    // Test 3: Contract Deployment
    try {
      const contracts = getContractConfig(chainId!);
      const contractAddress = contracts.address;

      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        results.push({
          name: 'Contract Deployment',
          status: 'error',
          message: `No contract found at ${contractAddress}`
        });
      } else {
        results.push({
          name: 'Contract Deployment',
          status: 'success',
          message: `Contract deployed at ${contractAddress}`
        });
      }
    } catch (error) {
      results.push({
        name: 'Contract Deployment',
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to check contract deployment'
      });
    }

    // Test 4: Basic Contract Function
    try {
      const contracts = getContractConfig(chainId!);
      const contractAddress = contracts.address;

      // Simple test call
      await provider.call({
        to: contractAddress,
        data: '0x6394c7bb' // getTotalBatches() selector
      });

      results.push({
        name: 'Contract Function Test',
        status: 'success',
        message: 'Contract responding to function calls'
      });
    } catch (error) {
      results.push({
        name: 'Contract Function Test',
        status: 'error',
        message: 'Contract function calls failing'
      });
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isConnected) {
      runDiagnostics();
    }
  }, [isConnected, account, chainId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'checking':
        return '🔄';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Network Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-2">
        {diagnostics.length === 0 ? (
          <p className="text-gray-500 text-sm">Running diagnostics...</p>
        ) : (
          diagnostics.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getStatusIcon(result.status)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{result.name}</div>
                  <div className="text-xs opacity-75">{result.message}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {chainId && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Network:</strong> {getNetworkName(chainId)} (Chain ID {chainId})
            <br />
            <strong>Contract:</strong> {(() => {
              try {
                return getContractConfig(chainId).address;
              } catch {
                return 'Not deployed for this network';
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}