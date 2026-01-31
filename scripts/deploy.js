const hre = require("hardhat");

async function main() {
  console.log("Deploying DiceGame contract...");

  const [signer] = await hre.ethers.getSigners();
  console.log(`Deploying from: ${signer.address}`);

  const DiceGame = await hre.ethers.getContractFactory("DiceGame", signer);
  const diceGame = await DiceGame.deploy();

  await diceGame.waitForDeployment();

  const address = await diceGame.getAddress();
  console.log(`✓ DiceGame deployed to: ${address}`);

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`✓ Network: ${network.name} (chainId: ${network.chainId})`);

  // Log initial stats
  const stats = await diceGame.getStats();
  console.log(`✓ Initial stats:
    - Total games: ${stats._totalGames}
    - Total volume: ${hre.ethers.formatEther(stats._totalVolume)} ETH
    - Total wins: ${stats._totalWins}
    - Win rate: ${stats._winRate}%
    - Contract balance: ${hre.ethers.formatEther(stats._contractBalance)} ETH
  `);

  return address;
}

main()
  .then((address) => {
    console.log("✓ Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
