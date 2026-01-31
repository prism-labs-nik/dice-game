const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const contractAddress = "0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E";
  
  // Load contract ABI
  const DiceGame = await hre.ethers.getContractFactory("DiceGame");
  const diceGame = DiceGame.attach(contractAddress).connect(signer);
  
  console.log("=== DICE GAME TEST SUITE ===\n");
  console.log(`Player: ${signer.address}`);
  console.log(`Contract: ${contractAddress}\n`);
  
  // Get initial stats
  let stats = await diceGame.getStats();
  console.log("📊 Initial Contract Stats:");
  console.log(`   - Total games: ${stats._totalGames}`);
  console.log(`   - Total volume: ${hre.ethers.formatEther(stats._totalVolume)} ETH`);
  console.log(`   - Win rate: ${stats._winRate}%`);
  console.log(`   - Contract balance: ${hre.ethers.formatEther(stats._contractBalance)} ETH\n`);
  
  // Test: Roll with valid stake
  console.log("🎲 Test 1: Rolling with 0.001 ETH stake...");
  try {
    const tx = await diceGame.roll({
      value: hre.ethers.parseEther("0.001"),
    });
    
    const receipt = await tx.wait();
    console.log(`   ✓ Transaction confirmed: ${receipt.hash}`);
    console.log(`   ✓ Gas used: ${receipt.gasUsed}`);
    
    // Get the game ID from events
    const events = receipt.logs;
    console.log(`   ✓ Events: ${events.length}\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }
  
  // Get updated stats
  stats = await diceGame.getStats();
  console.log("📊 Updated Contract Stats:");
  console.log(`   - Total games: ${stats._totalGames}`);
  console.log(`   - Total volume: ${hre.ethers.formatEther(stats._totalVolume)} ETH`);
  console.log(`   - Total wins: ${stats._totalWins}`);
  console.log(`   - Win rate: ${stats._winRate}%`);
  console.log(`   - Contract balance: ${hre.ethers.formatEther(stats._contractBalance)} ETH\n`);
  
  // Test: Roll with minimum stake (0.001 ETH)
  console.log("🎲 Test 2: Rolling with minimum stake (0.001 ETH)...");
  try {
    const tx = await diceGame.roll({
      value: hre.ethers.parseEther("0.001"),
    });
    
    const receipt = await tx.wait();
    console.log(`   ✓ Transaction confirmed: ${receipt.hash}`);
    console.log(`   ✓ Success\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }
  
  // Test: Try to roll with insufficient stake (should fail)
  console.log("🎲 Test 3: Attempting to roll with 0.0001 ETH (below minimum)...");
  try {
    const tx = await diceGame.roll({
      value: hre.ethers.parseEther("0.0001"),
    });
    
    await tx.wait();
    console.log(`   ✗ Should have failed but succeeded\n`);
  } catch (error) {
    if (error.message.includes("Minimum stake")) {
      console.log(`   ✓ Correctly rejected: ${error.reason || error.message}\n`);
    } else {
      console.error(`   ✗ Unexpected error: ${error.message}\n`);
    }
  }
  
  // Final stats
  stats = await diceGame.getStats();
  console.log("📊 Final Contract Stats:");
  console.log(`   - Total games: ${stats._totalGames}`);
  console.log(`   - Total volume: ${hre.ethers.formatEther(stats._totalVolume)} ETH`);
  console.log(`   - Total wins: ${stats._totalWins}`);
  console.log(`   - Win rate: ${stats._winRate}%`);
  console.log(`   - Contract balance: ${hre.ethers.formatEther(stats._contractBalance)} ETH\n`);
  
  console.log("✅ Test suite complete!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
