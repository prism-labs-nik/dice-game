const { expect } = require("chai");
const hre = require("hardhat");

describe("DiceGame", function () {
  let diceGame;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await hre.ethers.getSigners();

    const DiceGame = await hre.ethers.getContractFactory("DiceGame");
    diceGame = await DiceGame.deploy();
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
      const lowStake = hre.ethers.parseEther("0.0001");
      await expect(
        player1.sendTransaction({
          to: await diceGame.getAddress(),
          value: lowStake,
          data: diceGame.interface.encodeFunctionData("roll"),
        })
      ).to.be.revertedWith("Minimum stake is 0.001 ETH");
    });

    it("Should accept valid stake and create game", async function () {
      const stake = hre.ethers.parseEther("0.1");
      const tx = await diceGame.connect(player1).roll({ value: stake });

      expect(tx).to.emit(diceGame, "GameStarted");
      expect(await diceGame.totalGames()).to.equal(1);
      expect(await diceGame.totalVolume()).to.equal(stake);
    });

    it("Should increment game counter", async function () {
      const stake = hre.ethers.parseEther("0.1");
      await diceGame.connect(player1).roll({ value: stake });
      await diceGame.connect(player2).roll({ value: stake });

      expect(await diceGame.totalGames()).to.equal(2);
      expect(await diceGame.totalVolume()).to.equal(stake * 2n);
    });
  });

  describe("Game Resolution", function () {
    it("Should mark game as resolved after roll", async function () {
      const stake = hre.ethers.parseEther("0.1");
      await diceGame.connect(player1).roll({ value: stake });

      const gameId = 0;
      const game = await diceGame.getGame(gameId);
      expect(game.resolved).to.be.true;
      expect(game.player).to.equal(player1.address);
      expect(game.stake).to.equal(stake);
    });

    it("Should emit GameResolved event", async function () {
      const stake = hre.ethers.parseEther("0.1");
      await expect(diceGame.connect(player1).roll({ value: stake })).to.emit(
        diceGame,
        "GameResolved"
      );
    });
  });

  describe("Statistics", function () {
    it("Should track stats correctly", async function () {
      const stake = hre.ethers.parseEther("0.1");
      await diceGame.connect(player1).roll({ value: stake });
      await diceGame.connect(player2).roll({ value: stake });

      const stats = await diceGame.getStats();
      expect(stats._totalGames).to.equal(2);
      expect(stats._totalVolume).to.equal(stake * 2n);
    });

    it("Should calculate win rate", async function () {
      const stake = hre.ethers.parseEther("0.01");

      for (let i = 0; i < 10; i++) {
        await diceGame.connect(player1).roll({ value: stake });
      }

      const stats = await diceGame.getStats();
      expect(stats._totalGames).to.equal(10);
      expect(stats._winRate).to.be.greaterThanOrEqual(0);
      expect(stats._winRate).to.be.lessThanOrEqual(100);
      console.log(`  Win rate: ${stats._winRate}% out of 10 games`);
    });
  });

  describe("Owner Functions", function () {
    it("Only owner should withdraw", async function () {
      await expect(
        diceGame.connect(player1).withdrawHouseBalance()
      ).to.be.revertedWith("Only owner");
    });
  });
});
