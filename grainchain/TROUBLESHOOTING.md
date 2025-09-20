# BatchTracker DApp Troubleshooting Guide

## Common Issues and Solutions

### 1. "Internal JSON-RPC error" when creating batches

This error typically occurs due to network or contract deployment issues.

**Symptoms:**
- Error message: `"code": -32603, "message": "Internal JSON-RPC error."`
- Transaction fails before reaching the blockchain

**Solutions:**

#### A. Verify Contract Deployment
1. Check if your local blockchain is running:
   ```bash
   # For Hardhat
   npx hardhat node
   ```

2. Verify the contract is deployed:
   ```bash
   # Deploy the contract
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. Update the contract address in `app/config/contracts.ts` with the deployed address

#### B. Check MetaMask Configuration
1. **Network Settings for Hardhat (Recommended):**
   - Network Name: `Hardhat`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

   **Alternative for Localhost:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

2. **Account Setup:**
   - Import an account using a private key from your local blockchain
   - Ensure the account has test ETH for gas fees

#### C. Reset MetaMask State
1. Go to MetaMask Settings > Advanced
2. Click "Reset Account" to clear transaction history
3. Reconnect to your DApp

### 2. "No contract found at address" Error

**Cause:** Contract not deployed or wrong address

**Solution:**
1. Verify your local blockchain is running
2. Deploy the BatchTracker contract:
   ```solidity
   // Example deployment script (scripts/deploy.js)
   const BatchTracker = await ethers.getContractFactory("BatchTracker");
   const batchTracker = await BatchTracker.deploy();
   await batchTracker.deployed();
   console.log("BatchTracker deployed to:", batchTracker.address);
   ```
3. Copy the deployed address to `app/config/contracts.ts`

### 3. "Insufficient funds" Error

**Cause:** Account doesn't have enough ETH for gas fees

**Solution:**
1. Check your account balance in MetaMask
2. If using Hardhat, accounts are pre-funded with 10,000 ETH
3. If using Ganache, ensure you're using a funded account

### 4. "Gas estimation failed" Errors

**Cause:** Network connectivity issues or contract problems

**Solution:**
The DApp now includes automatic fallback gas limits, but you can also:
1. Check network connectivity
2. Verify contract is properly deployed
3. Try refreshing the page and reconnecting MetaMask

### 5. MetaMask Connection Issues

**Symptoms:**
- "MetaMask is not installed" error
- Connection fails repeatedly

**Solutions:**
1. **Install MetaMask:** Download from [metamask.io](https://metamask.io/)
2. **Enable DApp connections:** Check MetaMask settings
3. **Clear browser cache:** Sometimes helps with connection issues
4. **Try a different browser:** Chrome/Firefox work best

### 6. Wrong Network Error

**Symptoms:**
- Transactions fail with network mismatch
- Chain ID doesn't match

**Solution:**
1. Check your local blockchain's chain ID:
   ```bash
   # For Hardhat, default is 31337
   # For Ganache, default is 1337
   ```
2. Update MetaMask network settings to match
3. Update `app/config/contracts.ts` if needed

### 7. "User rejected transaction" Error

**Cause:** User cancelled the MetaMask transaction

**Solution:**
- This is expected behavior when users cancel
- Try the transaction again
- Check gas fees aren't too high

## Debugging Features

The DApp now includes several debugging features:

### 1. Network Diagnostics
- Automatically runs when wallet connects
- Shows network status, balance, and contract validation
- Use the "Refresh" button to re-run diagnostics

### 2. Console Logging
- Open browser Developer Tools (F12)
- Check Console tab for detailed transaction logs
- Look for gas estimation and transaction details

### 3. Enhanced Error Messages
- More specific error descriptions
- Automatic error categorization
- Suggestions for resolution

## Step-by-Step Verification

### Quick Setup Check:
1. ✅ Local blockchain running (Hardhat/Ganache)
2. ✅ Contract deployed and address updated
3. ✅ MetaMask installed and configured
4. ✅ Connected to correct network (Chain ID matches)
5. ✅ Account has sufficient ETH balance
6. ✅ DApp running at http://localhost:5173

### Testing Flow:
1. Connect MetaMask wallet
2. Check Network Diagnostics (should show all ✅)
3. Try creating a batch
4. Check browser console for detailed logs
5. If errors persist, check the specific error solutions above

## Getting Help

If you're still experiencing issues:

1. **Check Browser Console:** Open Developer Tools and look for detailed error messages
2. **Run Network Diagnostics:** Use the built-in diagnostics panel
3. **Verify Setup:** Follow the step-by-step verification above
4. **Check Blockchain Logs:** Look at your local blockchain console for errors

## Common Error Codes

- `-32603`: Internal JSON-RPC error (network/contract issue)
- `-32000`: Insufficient funds for gas
- `-32602`: Invalid params (usually wrong contract address)
- `4001`: User rejected transaction
- `4100`: Unauthorized (account not connected)

For any persistent issues, ensure your local blockchain is running and the contract is properly deployed with the correct address in the configuration.