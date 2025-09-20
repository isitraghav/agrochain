# BatchTracker DApp

A decentralized application (DApp) for tracking batch ownership and transfers on the Ethereum blockchain using the BatchTracker smart contract.

## Features

- **MetaMask Integration**: Connect your wallet to interact with the blockchain
- **Network Validation**: Automatic detection of supported networks (Hardhat/Localhost)
- **Dynamic Contract Loading**: Contracts loaded based on network deployment artifacts
- **Create Batches**: Create new batches that you own
- **View Owned Batches**: See all batches you currently own with their details
- **Transfer Ownership**: Transfer batch ownership to other Ethereum addresses
- **Real-time Updates**: Automatically refresh data after transactions
- **Enhanced Error Handling**: Comprehensive error messages and troubleshooting
- **Network Diagnostics**: Built-in diagnostics panel for debugging

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MetaMask** browser extension
3. **Local Blockchain** (Hardhat, Ganache, or similar)
4. **Deployed BatchTracker Contract** on your local network

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy the BatchTracker Contract

First, set up a local blockchain network (example using Hardhat):

```bash
# Install Hardhat (if not already installed)
npm install --save-dev hardhat

# Initialize Hardhat project
npx hardhat

# Start local node
npx hardhat node
```

Deploy the BatchTracker contract to your local network:

```solidity
// Create a deployment script in scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const BatchTracker = await hre.ethers.getContractFactory("BatchTracker");
  const batchTracker = await BatchTracker.deploy();

  await batchTracker.deployed();

  console.log("BatchTracker deployed to:", batchTracker.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run the deployment:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Update Contract Configuration

The DApp now uses deployment artifacts for automatic contract loading. Update the deployment file for your network:

For **Hardhat** (Chain ID 31337), update `deployments/hardhat.json`:
```json
{
  "chainId": 31337,
  "name": "hardhat",
  "contracts": {
    "BatchTracker": {
      "address": "YOUR_DEPLOYED_CONTRACT_ADDRESS",
      "deployer": "DEPLOYER_ADDRESS",
      "deploymentTime": "TIMESTAMP",
      "transactionHash": "TX_HASH"
    }
  }
}
```

For **Localhost** (Chain ID 1337), update `deployments/localhost.json` similarly.

**The contract address will be automatically loaded based on your connected network!**

### 4. Configure MetaMask

1. Open MetaMask
2. Add a custom network with these settings for **Hardhat** (recommended):
   - **Network Name**: Hardhat
   - **New RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

   Alternative for **Localhost**:
   - **Network Name**: Localhost 8545
   - **New RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **Currency Symbol**: ETH

3. Import an account using a private key from your local blockchain
4. Ensure you have some test ETH for gas fees

**Important**: The DApp will automatically detect if you're on an unsupported network and show warnings.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Connect Wallet**: Click "Connect MetaMask" to connect your wallet
2. **Create Batch**: Use the "Create New Batch" section to create a batch
3. **View Batches**: Your owned batches will appear in the "Your Batches" section
4. **Transfer Batch**: Click "Transfer" on any batch to transfer ownership

## Project Structure

```
app/
├── components/           # React components
│   ├── batch-list.tsx       # Display owned batches
│   ├── batch-tracker-app.tsx # Main app component
│   ├── create-batch.tsx     # Create new batches
│   ├── transfer-batch.tsx   # Transfer batch ownership
│   └── wallet-connect.tsx   # MetaMask connection
├── config/
│   └── contracts.ts      # Contract addresses and ABIs
├── lib/
│   ├── contract.ts       # Contract interaction functions
│   └── web3-context.tsx  # Web3 context provider
└── routes/
    └── home.tsx         # Main route
```

## Smart Contract Functions Used

- `createBatch()` - Create a new batch
- `transferBatch(batchId, newOwner)` - Transfer batch ownership
- `getCurrentOwner(batchId)` - Get current owner of a batch
- `getBatchInfo(batchId)` - Get detailed batch information
- `getTotalBatches()` - Get total number of batches created

## Troubleshooting

### MetaMask Connection Issues
- Ensure MetaMask is unlocked and connected to the correct network
- Check that the network configuration matches your local blockchain

### Transaction Failures
- Ensure you have sufficient ETH for gas fees
- Verify the contract address is correct
- Check that you own the batch you're trying to transfer

### Contract Interaction Issues
- Verify the contract is deployed and the address is correct
- Ensure the ABI matches the deployed contract
- Check blockchain console for error messages

## Development

To modify the contract address or add new features:

1. Update `app/config/contracts.ts` for contract configuration
2. Modify `app/lib/contract.ts` for new contract functions
3. Add new components in `app/components/` as needed

---

Built with React Router, ethers.js, and TailwindCSS.
