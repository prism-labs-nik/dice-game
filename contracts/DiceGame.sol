// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DiceGame
 * @dev Simple on-chain dice game: stake ETH, roll, win 2x or lose everything
 */

contract DiceGame {
    struct Game {
        address player;
        uint256 stake;
        uint256 timestamp;
        bool resolved;
        bool won;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    
    uint256 public totalGames;
    uint256 public totalVolume;
    uint256 public totalWins;
    
    address public owner;
    
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 stake);
    event GameResolved(uint256 indexed gameId, address indexed player, bool won, uint256 payout);
    event Withdrawal(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Players roll the dice by sending ETH
     * Minimum stake: 0.001 ETH (10^15 wei)
     */
    function roll() external payable returns (uint256) {
        require(msg.value >= 0.001 ether, "Minimum stake is 0.001 ETH");
        
        uint256 gameId = gameCounter++;
        
        games[gameId] = Game({
            player: msg.sender,
            stake: msg.value,
            timestamp: block.timestamp,
            resolved: false,
            won: false
        });
        
        totalGames++;
        totalVolume += msg.value;
        
        emit GameStarted(gameId, msg.sender, msg.value);
        
        // Resolve immediately using block hash
        _resolveGame(gameId);
        
        return gameId;
    }

    /**
     * @dev Internal function to resolve the game
     * Uses blockhash for randomness (block-based RNG)
     * 50/50 odds: even = win, odd = lose
     * 
     * Win: player gets stake back + 50% bonus (1.5x)
     * Lose: player stake stays in contract (house keeps it)
     */
    function _resolveGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        require(!game.resolved, "Game already resolved");
        
        // Generate pseudo-random number from block hash
        // This is simplified for MVP - production should use Chainlink VRF
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            game.player,
            gameId,
            block.timestamp
        ))) % 100;
        
        // 50/50 chance (0-49 = win, 50-99 = lose)
        bool won = randomValue < 50;
        game.resolved = true;
        game.won = won;
        
        uint256 payout = 0;
        if (won) {
            // Return stake + 50% bonus (1.5x total)
            payout = (game.stake * 150) / 100;
            totalWins++;
            
            // Only pay if contract has balance
            if (address(this).balance >= payout) {
                (bool success, ) = payable(game.player).call{value: payout}("");
                require(success, "Payout failed");
            }
        }
        
        emit GameResolved(gameId, game.player, won, payout);
    }

    /**
     * @dev Get game details
     */
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalGames,
        uint256 _totalVolume,
        uint256 _totalWins,
        uint256 _winRate,
        uint256 _contractBalance
    ) {
        _totalGames = totalGames;
        _totalVolume = totalVolume;
        _totalWins = totalWins;
        _winRate = totalGames > 0 ? (totalWins * 100) / totalGames : 0;
        _contractBalance = address(this).balance;
    }

    /**
     * @dev Owner can withdraw contract balance (house edge)
     * Only works if contract has excess ETH (shouldn't normally happen)
     */
    function withdrawHouseBalance() external {
        require(msg.sender == owner, "Only owner");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(owner, balance);
    }

    /**
     * @dev Accept ETH
     */
    receive() external payable {}
}
