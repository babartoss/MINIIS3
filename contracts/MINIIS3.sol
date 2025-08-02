// File: contracts/MINIIS3.sol (Updated to make reward per match and bet amount variable)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MINIIS3 is Ownable {
    IERC20 public usdc;
    mapping(uint256 => mapping(uint8 => address)) public selectedNumbers; // round => number => address
    mapping(uint256 => uint8[5]) public winningNumbers; // round => winners
    mapping(uint256 => bool) public roundClosed;
    mapping(uint256 => mapping(address => bool)) public claimed; // round => address => has claimed
    mapping(uint256 => uint256) public selectedCount; // round => count of selected numbers
    uint256 public currentRound = 1;
    uint256 public betAmount = 10000; // 0.01 USDC (6 decimals), ban đầu, có thể thay đổi
    uint256 public rewardPerMatch = 200000; // Ban đầu 0.20 USDC (6 decimals), có thể thay đổi
    uint256 public poolBalance;

    event NumberSelected(uint256 round, address selector, uint8 number);
    event RoundEnded(uint256 round, uint8[5] winners);
    event RewardClaimed(uint256 round, address claimant, uint256 amount);
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event RewardPerMatchUpdated(uint256 newReward); // Event để track thay đổi reward
    event BetAmountUpdated(uint256 newAmount); // Event mới để track thay đổi bet amount

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    function selectNumber(uint8 number) external {
        require(!roundClosed[currentRound], "Round closed");
        require(selectedCount[currentRound] < 100, "Round full");
        require(number < 100, "Invalid number");
        require(selectedNumbers[currentRound][number] == address(0), "Number taken");

        require(usdc.transferFrom(msg.sender, address(this), betAmount), "Bet payment failed");
        poolBalance += betAmount;

        selectedNumbers[currentRound][number] = msg.sender;
        selectedCount[currentRound]++;
        emit NumberSelected(currentRound, msg.sender, number);
    }

    function depositReward(uint256 amount) external onlyOwner {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Deposit failed");
        poolBalance += amount;
        emit Deposited(amount);
    }

    function withdrawReward(uint256 amount) external onlyOwner {
        require(poolBalance >= amount, "Insufficient balance");
        poolBalance -= amount;
        require(usdc.transfer(msg.sender, amount), "Withdraw failed");
        emit Withdrawn(amount);
    }

    function setWinningNumbers(uint8[5] memory _winners) external onlyOwner {
        require(!roundClosed[currentRound], "Already set");
        winningNumbers[currentRound] = _winners;
        roundClosed[currentRound] = true;
        emit RoundEnded(currentRound, _winners);
    }

    function claimReward(uint256 round) external {
        require(roundClosed[round], "Round not ended");
        require(!claimed[round][msg.sender], "Already claimed");
        address claimant = msg.sender;
        uint256 matches = 0;
        for (uint8 i = 0; i < 100; i++) {
            if (selectedNumbers[round][i] == claimant) {
                for (uint8 j = 0; j < 5; j++) {
                    if (i == winningNumbers[round][j]) {
                        matches++;
                    }
                }
            }
        }
        require(matches > 0, "No matches");
        uint256 reward = matches * rewardPerMatch; // Sử dụng variable
        require(poolBalance >= reward, "Insufficient pool");
        poolBalance -= reward;
        claimed[round][msg.sender] = true;
        require(usdc.transfer(claimant, reward), "Transfer failed");
        emit RewardClaimed(round, claimant, reward);
    }

    function startNewRound() external onlyOwner {
        currentRound++;
        roundClosed[currentRound] = false;
        // selectedCount[currentRound] defaults to 0
    }

    function getPoolBalance() external view returns (uint256) {
        return poolBalance;
    }

    // New function to check if user has claimed for a round
    function hasClaimed(uint256 round, address user) external view returns (bool) {
        return claimed[round][user];
    }

    // New function to update reward per match (only owner)
    function setRewardPerMatch(uint256 newReward) external onlyOwner {
        require(newReward > 0, "Reward must be positive");
        rewardPerMatch = newReward;
        emit RewardPerMatchUpdated(newReward);
    }

    // New function to update bet amount (only owner)
    function setBetAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Bet amount must be positive");
        betAmount = newAmount;
        emit BetAmountUpdated(newAmount);
    }
}