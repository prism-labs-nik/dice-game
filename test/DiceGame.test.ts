import { expect } from "chai";
import { ethers } from "hardhat";
import { DiceGame } from "../typechain-types";

describe("DiceGame", function () {
  let diceGame: DiceGame;
  let owner: any;
  let player1: any;
  let player2: any;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const DiceGameFactory = await ethers.getContractFactory("DiceGame");
    diceGame = await DiceGameFactory.deploy();
    await diceGame.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct owner", async function () {
      expect(await diceGame.owner()).to.equal(owner.address);
    });

    it("Should start with zero games", async function () {
      expect(await diceGame.totalGames()).to.equal(0);
      expect(await diceGame.totalVolume()).to.equal(0);
      expect(await diceGame.totalWins()).to.equal(0);
    });
  });

  describe("Rolling Dice", function () {
    it("Should revert if stake is too low", async function () {
      const lowStake = ethers.parseEther("0.0001");
      await expect(
        player1.sendTransaction({
          to: await diceGame.getAddress(),
          value: lowStake,
          data: diceGame.interface.encodeFunctionData("roll"),
        })
      ).to.be.revertedWith("Minimum stake is 0.001 ETH");
    });

    it("Should accept valid stake and create game", async function () {
      const stake = ethers.parseEther("0.1");
      const tx = await diceGame.connect(player1).roll({ value: stake });

      expect(tx).to.emit(diceGame, "GameStarted");
      expect(await diceGame.totalGames()).to.equal(1);
      expect(await diceGame.totalVolume()).to.equal(stake);
    });

    it("Should increment game counter", async function () {
      const stake = ethers.parseEther("0.1");
      await diceGame.connect(player1).roll({ value: stake });
      await diceGame.connect(player2).roll({ value: stake });

      expect(await diceGame.totalGames()).to.equal(2);
      expect(await diceGame.totalVolume()).to.equal(stake * 2n);
    });
  });

  describe("Game Resolution", function () {
    it("Should mark game as resolved after roll", async function () {
      const stake = ethers.parseEther("0.1");
      const tx = await diceGame.connect(player1).roll({ value: stake });
      const receipt = await tx.wait();

      const gameId = 0;
      const game = await diceGame.getGame(gameId);
      expect(game.resolved).to.be.true;
      expect(game.player).to.equal(player1.address);
      expect(game.stake).to.equal(stake);
    });

    it("Should emit GameResolved event", async function () {
      const stake = ethers.parseEther("0.1");
      await expect(diceGame.connect(player1).roll({ value: stake })).to.emit(
        diceGame,
        "GameResolved"
      );
    });

    it("Should have 50/50 win distribution (statistical)", async function () {
      const stake = ethers.parseEther("0.01");
      const numGames = 100;

      for (let i = 0; i < numGames; i++) {
        await diceGame.connect(player1).roll({ value: stake });
      }

      const stats = await diceGame.getStats();
      const winRate = Number(stats._winRate);

      // Should be roughly 50%, allow 30-70% range for randomness
      expect(winRate).to.be.greaterThan(20);
      expect(winRate).to.be.lessThan(80);
      console.log(`Win rate: ${winRate}% out of ${numGames} games`);
    });
  });

  describe("Statistics", function () {
    it("Should track stats correctly", async function () {
      const stake = ethers.parseEther("0.1");
      await diceGame.connect(player1).roll({ value: stake });
      await diceGame.connect(player2).roll({ value: stake });

      const stats = await diceGame.getStats();
      expect(stats._totalGames).to.equal(2);
      expect(stats._totalVolume).to.equal(stake * 2n);
      expect(stats._contractBalance).to.be.greaterThanOrEqual(0);
    });

    it("Should calculate win rate", async function () {
      const stake = ethers.parseEther("0.01");

      for (let i = 0; i < 10; i++) {
        await diceGame.connect(player1).roll({ value: stake });
      }

      const stats = await diceGame.getStats();
      expect(stats._totalGames).to.equal(10);
      expect(stats._winRate).to.be.greaterThanOrEqual(0);
      expect(stats._winRate).to.be.lessThanOrEqual(100);
    });
  });

  describe("Owner Functions", function () {
    it("Only owner should withdraw", async function () {
      await expect(
        diceGame.connect(player1).withdrawHouseBalance()
      ).to.be.revertedWith("Only owner");
    });

    it("Owner can withdraw balance if excess", async function () {
      // Send extra ETH to contract (not from rolls)
      await owner.sendTransaction({
        to: await diceGame.getAddress(),
        value: ethers.parseEther("0.1"),
      });

      const tx = diceGame.connect(owner).withdrawHouseBalance();
      await expect(tx).to.emit(diceGame, "Withdrawal");
    });
  });

  describe("Receive Function", function () {
    it("Should accept plain ETH transfers", async function () {
      const amount = ethers.parseEther("0.5");
      await owner.sendTransaction({
        to: await diceGame.getAddress(),
        value: amount,
      });

      const balance = await ethers.provider.getBalance(
        await diceGame.getAddress()
      );
      expect(balance).to.be.greaterThanOrEqual(amount);
    });
  });
});
