'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import DiceGameUI from '../components/DiceGameUI';

const DICE_CONTRACT_ADDRESS = '0x6352200830D05B5F3B6e04cA24c3A5d04bd2f15E';

const DICE_ABI = [
  'function roll() external payable returns (uint256)',
  'function getStats() external view returns (uint256, uint256, uint256, uint256, uint256)',
  'function getGame(uint256 gameId) external view returns (tuple(address player, uint256 stake, uint256 timestamp, bool resolved, bool won))',
  'event GameStarted(indexed uint256 gameId, indexed address player, uint256 stake)',
  'event GameResolved(indexed uint256 gameId, indexed address player, bool won, uint256 payout)',
];

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts.length > 0) {
            connectWallet();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      };

      checkConnection();

      window.ethereum.on('accountsChanged', () => {
        connectWallet();
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      
      setProvider(browserProvider);
      setAccount(accounts[0]);
      setIsConnected(true);

      const signer = await browserProvider.getSigner();
      const gameContract = new ethers.Contract(
        DICE_CONTRACT_ADDRESS,
        DICE_ABI,
        signer
      );
      setContract(gameContract);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setAccount(null);
    setContract(null);
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🎲 DICE GAME</h1>
          <p className="text-gray-300 text-lg">Roll the dice, test your luck on Base</p>
        </header>

        <div className="mb-6">
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
            >
              Connect MetaMask Wallet
            </button>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Connected Account:</p>
                  <p className="text-white font-mono text-sm">{account?.slice(0, 10)}...{account?.slice(-8)}</p>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {isConnected && contract && provider ? (
          <DiceGameUI contract={contract} provider={provider} account={account || ''} />
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-300">Connect your wallet to play</p>
          </div>
        )}

        <footer className="mt-12 text-center text-gray-400 text-sm">
          <p>Contract: {DICE_CONTRACT_ADDRESS}</p>
          <p className="mt-2">⚠️ For testing only. Always verify contract before playing.</p>
        </footer>
      </div>
    </div>
  );
}
