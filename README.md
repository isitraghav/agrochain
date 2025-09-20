# AgroChain - Blockchain-Based Batch Tracking System

A Solidity smart contract system for tracking batch ownership and transfers on the Ethereum blockchain. This project provides a decentralized solution for tracking batches through their lifecycle as they change ownership.

## Features

- **Batch Creation**: Create unique batches with automatic ID generation
- **Ownership Tracking**: Maintain complete ownership history for each batch
- **Secure Transfers**: Only current owner can transfer batch ownership
- **Historical Data**: Query past ownership and transfer information
- **Event Logging**: All operations emit events for off-chain tracking

## Smart Contract Functionality

### Core Functions

- `createBatch()`: Creates a new batch with the caller as initial owner
- `transferBatch(batchId, newOwner)`: Transfers batch to a new owner (only current owner)
- `getCurrentOwner(batchId)`: Returns the current owner of a batch
- `getOwnerHistory(batchId)`: Returns complete ownership history
- `getBatchInfo(batchId)`: Returns comprehensive batch information
- `wasOwner(batchId, address)`: Checks if an address was ever an owner

### Security Features

- Only current owner can transfer batches
- Cannot transfer to zero address
- Cannot transfer to current owner
- Batch existence validation
- Comprehensive error handling

## Project Structure

```
batch-tracker/
├── contracts/
│   └── BatchTracker.sol          # Main smart contract
├── scripts/
│   ├── deploy.js                 # Deployment script
│   └── interact.js               # Contract interaction examples
├── test/
│   └── BatchTracker.test.js      # Comprehensive test suite
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Git

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /home/raghav/Desktop/batch-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

Edit the `.env` file with your settings:

```env
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Etherscan API Key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Gas reporting (set to true to enable)
REPORT_GAS=false
```

## Usage

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy to Local Network

1. **Start local Hardhat node:**
   ```bash
   npm run node
   ```

2. **Deploy (in another terminal):**
   ```bash
   npm run deploy:localhost
   ```

### Deploy to Testnet (Sepolia)

```bash
npm run deploy:sepolia
```

### Deploy to Mainnet

```bash
npm run deploy:mainnet
```

## Contract Interaction Examples

### Creating a Batch

```javascript
const batchTracker = await ethers.getContractAt("BatchTracker", contractAddress);
const tx = await batchTracker.createBatch();
const receipt = await tx.wait();

// Get batch ID from event
const event = receipt.events.find(e => e.event === 'BatchCreated');
const batchId = event.args.batchId;
```

### Transferring a Batch

```javascript
const batchId = 1;
const newOwnerAddress = "0x...";

const tx = await batchTracker.transferBatch(batchId, newOwnerAddress);
await tx.wait();
```

### Querying Batch Information

```javascript
// Get current owner
const currentOwner = await batchTracker.getCurrentOwner(batchId);

// Get ownership history
const ownerHistory = await batchTracker.getOwnerHistory(batchId);

// Get complete batch info
const batchInfo = await batchTracker.getBatchInfo(batchId);
console.log({
  batchId: batchInfo[0],
  currentOwner: batchInfo[1],
  ownerCount: batchInfo[2],
  createdAt: new Date(batchInfo[3] * 1000),
  lastTransferAt: new Date(batchInfo[4] * 1000)
});
```

## Testing

The project includes comprehensive tests covering:

- Contract deployment
- Batch creation
- Ownership transfers
- Access control
- Edge cases and error handling
- Security validations

Run all tests:
```bash
npm run test
```

Generate coverage report:
```bash
npm run coverage
```

## Gas Optimization

The contract is optimized for gas efficiency:

- Uses `uint256` for batch IDs (standard word size)
- Efficient storage patterns
- Minimal external calls
- Optimized compiler settings

Enable gas reporting:
```bash
REPORT_GAS=true npm run test
```

## Events

The contract emits the following events:

### BatchCreated
```solidity
event BatchCreated(uint256 indexed batchId, address indexed creator, uint256 timestamp);
```

### BatchTransferred
```solidity
event BatchTransferred(
    uint256 indexed batchId, 
    address indexed from, 
    address indexed to, 
    uint256 timestamp
);
```

## Security Considerations

- **Access Control**: Only current owner can transfer batches
- **Input Validation**: Comprehensive validation of all inputs
- **Reentrancy Protection**: No external calls in state-changing functions
- **Integer Overflow**: Uses Solidity 0.8.19 with built-in overflow protection
- **Zero Address Protection**: Prevents transfers to zero address

## Network Support

- **Local Development**: Hardhat Network
- **Testnet**: Sepolia (recommended for testing)
- **Mainnet**: Ethereum Mainnet (production)

## Contract Verification

After deployment to public networks, verify the contract on Etherscan:

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Error Handling

Common errors and solutions:

- `"Batch does not exist"`: Ensure batch ID is valid
- `"Only current owner can transfer batch"`: Use current owner's address
- `"Cannot transfer to zero address"`: Provide valid recipient address
- `"Cannot transfer to current owner"`: Transfer to different address

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:

1. Check the test files for usage examples
2. Review the contract documentation
3. Open an issue on the repository

## Roadmap

Future enhancements may include:

- Multi-signature ownership transfers
- Batch metadata storage
- Integration with IPFS for additional data
- Role-based access control
- Batch expiration functionality
- Integration with ERC-721 for unique batch tokens