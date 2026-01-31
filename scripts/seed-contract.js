const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const contractAddress = "0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E";
  
  console.log(`Sending 0.1 ETH to contract at ${contractAddress}...`);
  
  // Send remaining balance minus gas
  const balance = await signer.provider.getBalance(signer.address);
  const gasEstimate = hre.ethers.parseEther("0.0005"); // rough estimate for gas
  const toSend = balance - gasEstimate;
  
  if (toSend <= 0) {
    console.error("Insufficient balance to seed contract");
    process.exit(1);
  }
  
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} ETH`);
  console.log(`Sending: ${hre.ethers.formatEther(toSend)} ETH to contract`);
  
  const tx = await signer.sendTransaction({
    to: contractAddress,
    value: toSend,
  });
  
  await tx.wait();
  console.log(`✓ Sent ${hre.ethers.formatEther(toSend)} ETH to contract`);
  console.log(`✓ Tx hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
