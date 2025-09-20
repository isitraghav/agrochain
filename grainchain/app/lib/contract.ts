import { ethers } from 'ethers';
import { getContractConfig } from '../config/contracts';
import { pinataService } from './pinata';
import { MetadataStorage } from './metadata-storage';
import type { BatchFormData } from '../types/batch';

// Enhanced error handling
export function enhanceError(error: any): Error {
  console.error('Raw error object:', error);

  // Handle specific ethers.js error codes
  if (error?.code === 'UNKNOWN_ERROR' && error?.error?.message) {
    return new Error(`Transaction failed: ${error.error.message}`);
  }

  if (error?.code === 'INSUFFICIENT_FUNDS') {
    return new Error('Insufficient funds to complete transaction. Please check your account balance.');
  }

  if (error?.code === 'NETWORK_ERROR') {
    return new Error('Network connection error. Please check your connection and try again.');
  }

  if (error?.code === 'USER_REJECTED') {
    return new Error('Transaction was rejected by user.');
  }

  // Handle chainId errors specifically
  if (error?.message?.includes('invalid chainId') || error?.message?.includes('chainId')) {
    return new Error('ChainId mismatch. Please ensure MetaMask is connected to Hardhat network (chainId 31337). Go to MetaMask > Settings > Networks and verify the chainId is 31337.');
  }

  // Handle function selector errors
  if (error?.message?.includes('unrecognized selector') || error?.message?.includes('function selector')) {
    return new Error('Contract function not found. This may indicate an ABI mismatch or the contract was not deployed correctly. Please check the contract deployment.');
  }

  // Handle contract revert errors
  if (error?.message?.includes('execution reverted')) {
    const revertReason = extractRevertReason(error);
    return new Error(`Contract execution failed: ${revertReason || 'Unknown reason'}`);
  }

  // Handle JSON-RPC errors with more specific messages
  if (error?.message?.includes('Internal JSON-RPC error')) {
    return new Error('Blockchain network error. Please check: 1) MetaMask is connected to the correct network (chainId 31337), 2) Your local blockchain is running, 3) The contract is deployed at the correct address.');
  }

  // Handle call exceptions (view function failures)
  if (error?.code === 'CALL_EXCEPTION') {
    return new Error(`Contract call failed: ${error.reason || error.message}. The contract may not be deployed or the function parameters are invalid.`);
  }

  // Handle missing method errors
  if (error?.message?.includes('missing method') || error?.message?.includes('is not a function')) {
    return new Error('Contract method not found. This indicates an ABI mismatch with the deployed contract.');
  }

  // Handle timeout errors
  if (error?.code === 'TIMEOUT') {
    return new Error('Transaction timeout. The network may be congested or your local blockchain may not be responding.');
  }

  return error instanceof Error ? error : new Error(String(error));
}

// Extract revert reason from error
function extractRevertReason(error: any): string | null {
  if (error?.reason) return error.reason;
  if (error?.error?.reason) return error.error.reason;
  if (error?.message) {
    const match = error.message.match(/reverted with reason string '([^']+)'/);
    if (match) return match[1];
  }
  return null;
}

// Validate contract and signer
export async function validateContractAndSigner(signer: ethers.Signer): Promise<void> {
  try {
    // Check if signer has a provider
    if (!signer.provider) {
      throw new Error('Signer does not have a provider');
    }

    // Check network connectivity and get chainId
    const network = await signer.provider.getNetwork();
    const chainId = Number(network.chainId);

    // Get the correct contract configuration for this network
    let contracts;
    try {
      contracts = getContractConfig(chainId);
    } catch (configError) {
      throw new Error(`Network not supported: ${configError instanceof Error ? configError.message : 'Unknown config error'}`);
    }

    // Check if contract has code at the address
    const contractAddress = contracts.address;
    const code = await signer.provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error(`No contract found at address ${contractAddress} on chain ${chainId}. Please ensure the contract is deployed.`);
    }

    // Check if account is connected
    const address = await signer.getAddress();
    if (!address) {
      throw new Error('No account connected');
    }

    // Test contract read function
    const contract = getBatchTrackerContract(signer, chainId);
    await contract.getTotalBatches();

  } catch (error) {
    console.error('Contract validation failed:', error);
    throw enhanceError(error);
  }
}

export interface BatchInfo {
  batchId: number;
  currentOwner: string;
  ownerCount: number;
  createdAt: number;
  lastTransferAt: number;
  ipfsHash?: string;
  metadata?: any;
}

export function getBatchTrackerContract(
  signerOrProvider: ethers.Signer | ethers.Provider,
  chainId?: number
) {
  // If chainId not provided, try to get it from the provider
  const getChainIdFromProvider = async () => {
    if ('getNetwork' in signerOrProvider) {
      const network = await signerOrProvider.getNetwork();
      return Number(network.chainId);
    } else if (signerOrProvider.provider) {
      const network = await signerOrProvider.provider.getNetwork();
      return Number(network.chainId);
    }
    throw new Error('Cannot determine chainId');
  };

  // If chainId is provided, use it directly
  if (chainId) {
    const contracts = getContractConfig(chainId);
    return new ethers.Contract(
      contracts.address,
      contracts.abi,
      signerOrProvider
    );
  }

  // For backward compatibility, use default (Hardhat chainId 31337)
  try {
    const contracts = getContractConfig(31337);
    return new ethers.Contract(
      contracts.address,
      contracts.abi,
      signerOrProvider
    );
  } catch (error) {
    throw new Error('Unable to create contract instance. Please ensure the contract is deployed and chainId is correct.');
  }
}

export async function createBatchWithMetadata(
  signer: ethers.Signer,
  formData: BatchFormData
): Promise<number> {
  try {
    console.log('Creating batch with metadata...');

    // Get chainId for proper contract instantiation
    const network = await signer.provider!.getNetwork();
    const chainId = Number(network.chainId);

    // Create batch metadata and upload to IPFS
    const batchProperties = {
      origin: formData.origin,
      quality_grade: formData.quality_grade,
      harvest_date: formData.harvest_date,
      expiry_date: formData.expiry_date,
      weight: formData.weight,
      location: formData.location,
      certifications: formData.certifications,
    };

    // Upload to IPFS with metadata
    const { metadataHash } = await pinataService.uploadBatchWithAssets(
      formData.name,
      formData.description,
      formData.image,
      batchProperties,
      formData.attributes,
      formData.external_url
    );

    console.log('Metadata uploaded to IPFS with hash:', metadataHash);

    // Create batch on blockchain
    const contract = getBatchTrackerContract(signer, chainId);

    console.log('Sending blockchain transaction...');
    const tx = await contract.createBatch(metadataHash);

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt?.hash);

    // Parse the BatchCreated event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'BatchCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      const batchId = Number(parsed?.args[0]);
      
      // Store the IPFS hash mapping locally
      MetadataStorage.setBatchMetadata(batchId, metadataHash);
      
      console.log('Batch created with ID:', batchId, 'and IPFS hash:', metadataHash);
      return batchId;
    }

    throw new Error('BatchCreated event not found in transaction receipt');
  } catch (error) {
    console.error('Create batch with metadata error:', error);
    throw enhanceError(error);
  }
}

export async function createBatch(signer: ethers.Signer): Promise<number> {
  try {
    console.log('Creating batch...');

    // Get chainId for proper contract instantiation
    const network = await signer.provider!.getNetwork();
    const chainId = Number(network.chainId);

    const contract = getBatchTrackerContract(signer, chainId);

    console.log('Sending transaction...');
    const tx = await contract.createBatch("");

    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt?.hash);

    // Parse the BatchCreated event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'BatchCreated';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      const batchId = Number(parsed?.args[0]);
      console.log('Batch created with ID:', batchId);
      return batchId;
    }

    throw new Error('BatchCreated event not found in transaction receipt');
  } catch (error) {
    console.error('Create batch error:', error);
    throw enhanceError(error);
  }
}

export async function transferBatch(
  signer: ethers.Signer,
  batchId: number,
  newOwner: string
): Promise<void> {
  try {
    console.log(`Transferring batch ${batchId} to ${newOwner}...`);

    // Get chainId for proper contract instantiation
    const network = await signer.provider!.getNetwork();
    const chainId = Number(network.chainId);

    const contract = getBatchTrackerContract(signer, chainId);

    console.log('Sending transfer transaction...');
    const tx = await contract.transferBatch(batchId, newOwner);

    console.log('Transfer transaction sent:', tx.hash);
    await tx.wait();
    console.log('Transfer completed successfully');

  } catch (error) {
    console.error('Transfer batch error:', error);
    throw enhanceError(error);
  }
}

export async function getBatchInfo(
  provider: ethers.Provider,
  batchId: number
): Promise<BatchInfo> {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const contract = getBatchTrackerContract(provider, chainId);
  const result = await contract.getBatchInfo(batchId);

  const batchInfo: BatchInfo = {
    batchId: Number(result[0]),
    currentOwner: result[1],
    ownerCount: Number(result[2]),
    createdAt: Number(result[3]),
    lastTransferAt: Number(result[4]),
    ipfsHash: result[5] || undefined
  };

  return batchInfo;
}

export async function getBatchInfoWithMetadata(
  provider: ethers.Provider,
  batchId: number
): Promise<BatchInfo> {
  const batchInfo = await getBatchInfo(provider, batchId);
  
  // Fetch metadata from IPFS if hash exists
  if (batchInfo.ipfsHash) {
    try {
      const metadata = await pinataService.getBatchMetadata(batchInfo.ipfsHash);
      batchInfo.metadata = metadata;
    } catch (error) {
      console.error(`Failed to fetch metadata for batch ${batchId}:`, error);
    }
  }

  return batchInfo;
}

export async function getOwnerHistory(
  provider: ethers.Provider,
  batchId: number
): Promise<string[]> {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const contract = getBatchTrackerContract(provider, chainId);
  return await contract.getOwnerHistory(batchId);
}

export async function getTotalBatches(provider: ethers.Provider): Promise<number> {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const contract = getBatchTrackerContract(provider, chainId);
  const result = await contract.getTotalBatches();
  return Number(result);
}

export async function getUserOwnedBatches(
  provider: ethers.Provider,
  userAddress: string
): Promise<BatchInfo[]> {
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const contract = getBatchTrackerContract(provider, chainId);
  const totalBatches = await getTotalBatches(provider);
  const ownedBatches: BatchInfo[] = [];

  for (let i = 1; i <= totalBatches; i++) {
    try {
      // Try to get the current owner - this will fail if batch doesn't exist
      const currentOwner = await contract.getCurrentOwner(i);
      if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
        const batchInfo = await getBatchInfo(provider, i);
        ownedBatches.push(batchInfo);
      }
    } catch (error) {
      // Batch doesn't exist or other error - skip silently
      console.debug(`Batch ${i} doesn't exist or error occurred:`, error);
    }
  }

  return ownedBatches;
}