const hre = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("🚀 Deploying DICE Token to Base...");

  const PRISMLABS_WALLET = "0xdc1FD5D1cfFBAD5BddE104404d0D15eDB3e5BFb9";
  const DICE_GAME_ADDRESS = "0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E";

  const DiceToken = await hre.ethers.getContractFactory("DiceToken");
  
  const diceToken = await DiceToken.deploy(PRISMLABS_WALLET);
  await diceToken.waitForDeployment();

  const tokenAddress = await diceToken.getAddress();
  console.log(`✅ DICE Token deployed to: ${tokenAddress}`);

  // Set the Dice Game address
  const tx = await diceToken.setDiceGameAddress(DICE_GAME_ADDRESS);
  await tx.wait();
  console.log(`✅ Dice Game address set: ${DICE_GAME_ADDRESS}`);

  console.log("\n📊 Token Details:");
  console.log(`Token Name: DICE`);
  console.log(`Total Supply: 1,000,000 DICE`);
  console.log(`PrismLabs Wallet: ${PRISMLABS_WALLET}`);
  console.log(`Token Holders %: 20% of fees`);
  console.log(`PrismLabs %: 80% of fees`);
}

main().catch(console.error);
