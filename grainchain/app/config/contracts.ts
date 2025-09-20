// Import deployments
import localhostDeployment from '../../deployments/localhost.json';
import hardhatDeployment from '../../deployments/hardhat.json';
import { Contract, JsonRpcProvider, type Signer, type Provider } from 'ethers';

// BatchTracker ABI
const BATCH_TRACKER_ABI = [
  "function createBatch(string memory _ipfsHash) external returns (uint256)",
  "function transferBatch(uint256 _batchId, address _newOwner) external",
  "function updateMetadata(uint256 _batchId, string memory _newIpfsHash) external",
  "function getCurrentOwner(uint256 _batchId) external view returns (address)",
  "function getOwnerHistory(uint256 _batchId) external view returns (address[] memory)",
  "function getBatchInfo(uint256 _batchId) external view returns (uint256 batchId, address currentOwner, uint256 ownerCount, uint256 createdAt, uint256 lastTransferAt, string memory ipfsHash)",
  "function getTotalBatches() external view returns (uint256)",
  "function getOwnerCount(uint256 _batchId) external view returns (uint256)",
  "function wasOwner(uint256 _batchId, address _address) external view returns (bool)",
  "function batchExists(uint256 _batchId) external view returns (bool)",
  "event BatchCreated(uint256 indexed batchId, address indexed creator, uint256 timestamp, string ipfsHash)",
  "event BatchTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 timestamp)",
  "event MetadataUpdated(uint256 indexed batchId, string oldIpfsHash, string newIpfsHash, uint256 timestamp)"
];

// Network configs
export const NETWORKS = {
  1337: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    deployment: localhostDeployment
  },
  31337: {
    chainId: 31337,
    name: 'Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
    deployment: hardhatDeployment
  }
};

// Get contract config
export function getContractConfig(chainId: number) {
  const network = NETWORKS[chainId as keyof typeof NETWORKS];
  if (!network) {
    throw new Error(`Unsupported network. ChainId: ${chainId}. Supported networks: ${Object.keys(NETWORKS).join(', ')}`);
  }

  const batchTrackerAddress = network.deployment.contracts?.BatchTracker?.address;
  if (!batchTrackerAddress) {
    throw new Error(`BatchTracker contract not found in deployment for chainId ${chainId}`);
  }

  return { address: batchTrackerAddress, abi: BATCH_TRACKER_ABI };
}

// Get an ethers.Contract instance (v6 compatible)
export function getBatchTrackerContract(providerOrSigner: Provider | Signer, chainId: number) {
  const config = getContractConfig(chainId);
  return new Contract(config.address, config.abi, providerOrSigner);
}

// Default provider for localhost
export const LOCALHOST_PROVIDER = new JsonRpcProvider(NETWORKS[1337].rpcUrl);

// Helper: get network name
export function getNetworkName(chainId: number): string {
  const network = NETWORKS[chainId as keyof typeof NETWORKS];
  return network?.name || `Unknown Network (${chainId})`;
}
