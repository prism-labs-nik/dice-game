'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface DiceGameUIProps {
  contract: ethers.Contract;
  provider: ethers.BrowserProvider;
  account: string;
}

interface GameStats {
  totalGames: number;
  totalVolume: string;
  totalWins: number;
  winRate: number;
  contractBalance: string;
}

interface GameResult {
  gameId: number;
  won: boolean;
  payout: string;
  stake: string;
}

export default function DiceGameUI({ contract, provider, account }: DiceGameUIProps) {
  const [betAmount, setBetAmount] = useState<string>('0.01');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [lastGame, setLastGame] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await contract.getStats();
        setStats({
          totalGames: Number(statsData[0]),
          totalVolume: ethers.formatEther(statsData[1]),
          totalWins: Number(statsData[2]),
          winRate: Number(statsData[3]),
          contractBalance: ethers.formatEther(statsData[4]),
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [contract]);

  const playDice = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) < 0.001) {
      setError('Minimum bet is 0.001 ETH');
      return;
    }

    setLoading(true);
    setError('');
    setTransactionHash('');

    try {
      const betWei = ethers.parseEther(betAmount);
      
      const tx = await contract.roll({ value: betWei });
      setTransactionHash(tx.hash);

      const receipt = await tx.wait();

      // Get the game result from events
      const gameStartedEvent = receipt?.logs
        .map((log) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed;
          } catch {
            return null;
          }
        })
        .find((log) => log?.name === 'GameResolved');

      if (gameStartedEvent) {
        const gameId = Number(gameStartedEvent.args[0]);
        const won = gameStartedEvent.args[2];
        const payout = ethers.formatEther(gameStartedEvent.args[3]);

        setLastGame({
          gameId,
          won,
          payout,
          stake: betAmount,
        });
      }

      // Refresh stats
      const statsData = await contract.getStats();
      setStats({
        totalGames: Number(statsData[0]),
        totalVolume: ethers.formatEther(statsData[1]),
        totalWins: Number(statsData[2]),
        winRate: Number(statsData[3]),
        contractBalance: ethers.formatEther(statsData[4]),
      });
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      console.error('Error playing game:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Board */}
      <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-8 border-2 border-purple-500 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Roll the Dice</h2>

        <div className="space-y-4">
          {/* Bet Input */}
          <div>
            <label className="text-gray-300 text-sm font-semibold">Bet Amount (ETH)</label>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                step="0.001"
                min="0.001"
                max="1"
                disabled={loading}
                className="flex-1 bg-gray-600 text-white px-4 py-3 rounded border-2 border-gray-500 focus:border-purple-500 outline-none disabled:opacity-50"
                placeholder="0.01"
              />
              {/* Quick amount buttons */}
              <button
                onClick={() => setBetAmount('0.001')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-3 rounded text-sm"
                disabled={loading}
              >
                0.001
              </button>
              <button
                onClick={() => setBetAmount('0.01')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-3 rounded text-sm"
                disabled={loading}
              >
                0.01
              </button>
              <button
                onClick={() => setBetAmount('0.05')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-3 rounded text-sm"
                disabled={loading}
              >
                0.05
              </button>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={playDice}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition duration-200 transform ${
              loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
            }`}
          >
            {loading ? 'Rolling...' : '🎲 Roll the Dice!'}
          </button>

          {/* Error message */}
          {error && (
            <div className="bg-red-900 border-2 border-red-500 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Transaction hash */}
          {transactionHash && (
            <div className="bg-blue-900 border-2 border-blue-500 text-blue-100 px-4 py-3 rounded text-sm">
              <p className="font-semibold">Transaction:</p>
              <a
                href={`https://basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:underline font-mono"
              >
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Last Game Result */}
      {lastGame && (
        <div className={`rounded-lg p-6 border-2 ${
          lastGame.won
            ? 'bg-green-900 border-green-500'
            : 'bg-red-900 border-red-500'
        }`}>
          <h3 className={`text-2xl font-bold ${lastGame.won ? 'text-green-100' : 'text-red-100'}`}>
            {lastGame.won ? '🎉 YOU WON! 🎉' : '😢 Better luck next time'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-300">Bet Amount</p>
              <p className="text-white font-bold">{lastGame.stake} ETH</p>
            </div>
            <div>
              <p className="text-gray-300">Payout</p>
              <p className={`font-bold ${lastGame.won ? 'text-green-300' : 'text-red-300'}`}>
                {parseFloat(lastGame.payout) > 0 ? `${lastGame.payout} ETH` : '0 ETH'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="bg-gray-700 rounded-lg p-6 border-2 border-blue-500">
          <h3 className="text-xl font-bold text-white mb-4">📊 Game Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-sm">Total Games</p>
              <p className="text-white text-xl font-bold">{stats.totalGames.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-white text-xl font-bold">{stats.winRate}%</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-sm">Total Volume</p>
              <p className="text-white text-xl font-bold">{parseFloat(stats.totalVolume).toFixed(2)} ETH</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400 text-sm">House Balance</p>
              <p className="text-white text-xl font-bold">{parseFloat(stats.contractBalance).toFixed(4)} ETH</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
