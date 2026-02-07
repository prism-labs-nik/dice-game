// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DiceToken
 * @dev Revenue token for the Dice Game. 
 * Holders receive 20% of all fees from the Dice Game contract.
 */
contract DiceToken is ERC20, Ownable {
    address public diceGameAddress;
    address public prismlabsWallet;
    
    uint256 public tokenHoldersPercent = 20;  // 20% to token holders
    uint256 public prismlabsPercent = 80;     // 80% to PrismLabs
    
    uint256 public totalFeesCollected;
    uint256 public totalDistributed;
    
    mapping(address => uint256) public pendingDividends;
    
    event FeeCollected(uint256 amount);
    event DividendDistributed(address indexed recipient, uint256 amount);

    constructor(
        address _prismlabsWallet
    ) ERC20("Dice Token", "DICE") Ownable(msg.sender) {
        // Mint 1,000,000 DICE tokens to PrismLabs wallet
        _mint(_prismlabsWallet, 1_000_000 * 10 ** 18);
        prismlabsWallet = _prismlabsWallet;
    }

    /**
     * @dev Set the Dice Game contract address
     */
    function setDiceGameAddress(address _diceGameAddress) external onlyOwner {
        diceGameAddress = _diceGameAddress;
    }

    /**
     * @dev Collect fees from the Dice Game
     * Called by fee collector to distribute house edge
     */
    function collectFees() external payable {
        require(msg.value > 0, "No fees to collect");
        
        totalFeesCollected += msg.value;
        
        uint256 tokenHoldersFee = (msg.value * tokenHoldersPercent) / 100;
        uint256 prismlabsFee = (msg.value * prismlabsPercent) / 100;
        
        // Distribute to PrismLabs immediately
        (bool success, ) = payable(prismlabsWallet).call{value: prismlabsFee}("");
        require(success, "PrismLabs transfer failed");
        
        // Distribute to token holders proportionally
        if (totalSupply() > 0) {
            // Simple approach: accumulate for distribution
            totalDistributed += tokenHoldersFee;
            emit FeeCollected(msg.value);
        }
    }

    /**
     * @dev Get pending dividends for a holder
     */
    function getPendingDividends(address holder) external view returns (uint256) {
        if (totalSupply() == 0) return 0;
        uint256 holderShare = (balanceOf(holder) * totalDistributed) / totalSupply();
        return holderShare - pendingDividends[holder];
    }

    /**
     * @dev Claim pending dividends
     */
    function claimDividends() external {
        if (totalSupply() == 0) return;
        
        uint256 holderShare = (balanceOf(msg.sender) * totalDistributed) / totalSupply();
        uint256 pending = holderShare - pendingDividends[msg.sender];
        
        require(pending > 0, "No pending dividends");
        
        pendingDividends[msg.sender] = holderShare;
        
        (bool success, ) = payable(msg.sender).call{value: pending}("");
        require(success, "Dividend transfer failed");
        
        emit DividendDistributed(msg.sender, pending);
    }

    /**
     * @dev Accept ETH
     */
    receive() external payable {}
}
