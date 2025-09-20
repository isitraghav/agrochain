import { ethers } from 'ethers';
import { getContractConfig } from '../config/contracts';

// Function to calculate and log function selectors
export function logFunctionSelectors(chainId: number) {
  const contracts = getContractConfig(chainId);
  const iface = new ethers.Interface(contracts.abi);

  console.log('=== Function Selectors Debug ===');
  console.log('Contract Address:', contracts.address);
  console.log('Chain ID:', chainId);

  // Log all function selectors
  for (const func of iface.fragments) {
    if (func.type === 'function') {
      const funcFragment = func as ethers.FunctionFragment;
      const selector = iface.getFunction(funcFragment.name)?.selector;
      console.log(`${funcFragment.name}: ${selector}`);
    }
  }
  console.log('================================');
}

// Test basic contract connectivity
export async function testContractConnectivity(
  provider: ethers.Provider,
  chainId: number
): Promise<boolean> {
  try {
    console.log('=== Contract Connectivity Test ===');

    const contracts = getContractConfig(chainId);
    const contractAddress = contracts.address;

    console.log('Testing contract at:', contractAddress);
    console.log('Chain ID:', chainId);

    // Check if contract has code
    const code = await provider.getCode(contractAddress);
    console.log('Contract has code:', code !== '0x');

    if (code === '0x') {
      console.error('No contract found at address');
      return false;
    }

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      contracts.abi,
      provider
    );

    // Test the simplest read function first
    try {
      console.log('Testing getTotalBatches...');
      const totalBatches = await contract.getTotalBatches();
      console.log('getTotalBatches result:', totalBatches.toString());
      console.log('✅ Basic contract read successful');
      return true;
    } catch (error) {
      console.error('❌ getTotalBatches failed:', error);

      // Try alternative function names/selectors
      console.log('Trying alternative function calls...');

      // Try calling with explicit selector
      try {
        const selector = '0x6394c7bb'; // getTotalBatches() selector
        const result = await provider.call({
          to: contractAddress,
          data: selector
        });
        console.log('Direct call result:', result);
      } catch (directError) {
        console.error('Direct call also failed:', directError);
      }

      return false;
    }
  } catch (error) {
    console.error('Contract connectivity test failed:', error);
    return false;
  }
}

// Verify transaction chainId
export async function verifyTransactionChainId(
  signer: ethers.Signer
): Promise<boolean> {
  try {
    console.log('=== ChainId Verification ===');

    const network = await signer.provider!.getNetwork();
    const providerChainId = Number(network.chainId);

    // Get the chainId that will be used in transactions
    const address = await signer.getAddress();
    console.log('Signer address:', address);
    console.log('Provider chainId:', providerChainId);

    // Check if this chainId is supported
    const supportedChainIds = [1337, 31337];
    const isSupported = supportedChainIds.includes(providerChainId);

    console.log('ChainId supported:', isSupported);
    console.log('Expected chainIds:', supportedChainIds);

    if (!isSupported) {
      console.error('❌ ChainId not supported. Please switch network in MetaMask.');
      return false;
    }

    console.log('✅ ChainId verification passed');
    return true;
  } catch (error) {
    console.error('ChainId verification failed:', error);
    return false;
  }
}

// Test function call with specific parameters
export async function testFunctionCall(
  contract: ethers.Contract,
  functionName: string,
  params: any[] = []
): Promise<boolean> {
  try {
    console.log(`=== Testing ${functionName} ===`);
    console.log('Parameters:', params);

    const result = await contract[functionName](...params);
    console.log('✅ Function call successful');
    console.log('Result:', result);
    return true;
  } catch (error) {
    console.error(`❌ ${functionName} failed:`, error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
      if ('data' in error) {
        console.error('Error data:', (error as any).data);
      }
    }

    return false;
  }
}

// Comprehensive contract health check
export async function performContractHealthCheck(
  signer: ethers.Signer,
  chainId: number
): Promise<{
  success: boolean;
  issues: string[];
  details: any;
}> {
  const issues: string[] = [];
  const details: any = {};

  try {
    console.log('🔍 Starting comprehensive contract health check...');

    // 1. Log function selectors
    logFunctionSelectors(chainId);

    // 2. Verify chainId
    const chainIdOk = await verifyTransactionChainId(signer);
    details.chainIdValid = chainIdOk;
    if (!chainIdOk) {
      issues.push('ChainId validation failed');
    }

    // 3. Test basic connectivity
    const connectivityOk = await testContractConnectivity(signer.provider!, chainId);
    details.connectivityValid = connectivityOk;
    if (!connectivityOk) {
      issues.push('Contract connectivity failed');
    }

    // 4. Test specific functions if connectivity is OK
    if (connectivityOk) {
      const contracts = getContractConfig(chainId);
      const contract = new ethers.Contract(
        contracts.address,
        contracts.abi,
        signer
      );

      // Test each read function
      const readFunctions = [
        { name: 'getTotalBatches', params: [] },
        { name: 'batchExists', params: [1] }
      ];

      for (const func of readFunctions) {
        const success = await testFunctionCall(contract, func.name, func.params);
        details[`${func.name}Valid`] = success;
        if (!success) {
          issues.push(`Function ${func.name} failed`);
        }
      }
    }

    const success = issues.length === 0;
    console.log(success ? '✅ Health check passed' : '❌ Health check failed');
    console.log('Issues found:', issues);

    return {
      success,
      issues,
      details
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      success: false,
      issues: ['Health check crashed: ' + (error instanceof Error ? error.message : 'Unknown error')],
      details: { error }
    };
  }
}