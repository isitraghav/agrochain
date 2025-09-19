const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  console.log("Starting BatchTracker deployment...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the BatchTracker contract
  const BatchTracker = await ethers.getContractFactory("BatchTracker");
  console.log("Deploying BatchTracker...");
  
  const batchTracker = await BatchTracker.deploy();
  await batchTracker.waitForDeployment();
  
  const contractAddress = await batchTracker.getAddress();
  console.log("BatchTracker deployed to:", contractAddress);

  // Verify deployment by calling a read function
  const totalBatches = await batchTracker.getTotalBatches();
  console.log("Initial total batches:", totalBatches.toString());

  console.log("\nDeployment completed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", batchTracker.deploymentTransaction().hash);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    deploymentTime: new Date().toISOString(),
    transactionHash: batchTracker.deploymentTransaction().hash
  };
  
  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return batchTracker;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:");
    console.error(error);
    process.exit(1);
  });