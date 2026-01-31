# Dice Game Testing Guide

## ✅ Deployment Status

**Contract Address:** `0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E`  
**Network:** Base Mainnet (chainId: 8453)  
**Status:** ✅ Deployed and operational

---

## How to Test the Game

### Step 1: Fund Your MetaMask Wallet

The contract requires ETH to function:
- **Minimum stake per roll:** 0.001 ETH (~$3 at current prices)
- **Recommended balance:** 0.05 ETH for comfortable testing (10+ rolls)

**How to get Base ETH:**
1. Bridge ETH from mainnet via [bridge.base.org](https://bridge.base.org)
2. Use a faucet (if available)
3. Transfer from another account

---

### Step 2: Interact with the Contract

#### Option A: Using MetaMask Web3 Console
1. Go to BaseScan: https://basescan.org/address/0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E
2. Click **"Write Contract"** (requires MetaMask connection)
3. Connect your wallet
4. Click the **`roll()`** function
5. Enter **0.001** in the "value" field (in ETH)
6. Click "Write"
7. Confirm transaction in MetaMask

#### Option B: Using a Web UI
Create a simple HTML UI to interact with the contract:
```html
<button onclick="roll()">Roll the Dice (0.001 ETH)</button>

<script>
async function roll() {
  const contractAddress = "0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E";
  const ABI = [
    {
      "inputs": [],
      "name": "roll",
      "outputs": [{"type": "uint256"}],
      "stateMutability": "payable",
      "type": "function"
    }
  ];
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, ABI, signer);
  
  const tx = await contract.roll({
    value: ethers.parseEther("0.001")
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("Game resolved!");
}
</script>
```

---

## Expected Behavior

### Successful Roll
- **Stake:** 0.001 ETH sent to contract
- **Outcome:** 50/50 chance to win or lose
- **If Win (50%):** Receive 1.5x stake (0.0015 ETH)
- **If Lose (50%):** Lose stake, contract keeps it

### Contract Stats
After rolling, check stats at BaseScan:
- **Total games:** Increases by 1
- **Total volume:** Increases by stake amount
- **Win rate:** Calculated as (total wins / total games) × 100
- **Contract balance:** Increases on losses, decreases on wins

---

## Troubleshooting

### "Minimum stake is 0.001 ETH"
- You're sending less than 0.001 ETH
- **Fix:** Increase to at least 0.001 ETH (plus gas)

### "Insufficient funds for gas + value"
- Your wallet doesn't have enough ETH for the stake + gas fees
- **Fix:** Fund your wallet with more Base ETH

### "Payout failed"
- The contract ran out of ETH to pay winners
- **Fix:** This is unlikely with current mechanics; report if it happens

---

## Advanced Testing (Local)

### Run Test Suite
```bash
npx hardhat run scripts/test-gameplay.js --network base
```

### Deploy a Fresh Contract
```bash
npx hardhat run scripts/deploy.js --network base
```

### Manual Contract Interaction
```bash
npx hardhat console --network base
```

Then in the Hardhat console:
```javascript
const DiceGame = await ethers.getContractFactory("DiceGame");
const contract = DiceGame.attach("0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E");
const stats = await contract.getStats();
console.log(stats);
```

---

## Next Steps

1. ✅ Contract deployed and tested
2. ⏭️ Fund wallet with Base ETH
3. ⏭️ Execute rolls via MetaMask or web UI
4. ⏭️ Monitor stats on BaseScan
5. ⏭️ Iterate on mechanics based on gameplay data

---

**Questions?** Check the contract ABI and functions:
- `roll()` - Play (payable, min 0.001 ETH)
- `getGame(uint256 gameId)` - View game results
- `getStats()` - View contract-wide statistics
