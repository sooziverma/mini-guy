// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MiniGuyGame {
    struct PlayerState {
        uint256 coinBalance;
        uint256 streak;
        uint256 lastClaimTime;
        uint256 highScore;
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
    }

    mapping(address => PlayerState) public players;
    LeaderboardEntry[10] public leaderboard;
    
    address public owner;

    event DailyCheckInClaimed(address user, uint256 reward, uint256 streak);
    event ScoreSubmitted(address indexed player, uint256 score, bool isNewHighScore);

    uint256[7] public rewards = [100, 150, 200, 250, 300, 350, 500];

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function claimDailyCheckIn() external payable returns (uint256) {
        require(msg.value >= 0.000003 ether, "Fee: 0.000003 ETH required (~0.01 USD)");
        
        PlayerState storage player = players[msg.sender];
        uint256 nowTime = block.timestamp;
        
        // Cooldown check (24 hours)
        require(player.lastClaimTime == 0 || nowTime - player.lastClaimTime >= 24 hours, "Cooldown: 24 hours required");
        
        uint256 activeDay = 1;
        if (player.lastClaimTime != 0) {
            if (nowTime - player.lastClaimTime < 48 hours) {
                // Maintained streak: increment day, or wrap from Day 7 to Day 1
                if (player.streak >= 7) {
                    activeDay = 1;
                } else {
                    activeDay = player.streak + 1;
                }
            }
        }
        
        uint256 rewardAmount = rewards[activeDay - 1];
        
        player.coinBalance += rewardAmount;
        player.streak = activeDay;
        player.lastClaimTime = nowTime;
        
        emit DailyCheckInClaimed(msg.sender, rewardAmount, activeDay);
        return rewardAmount;
    }

    function submitScore(uint256 score) external payable {
        require(msg.value >= 0.000003 ether, "Fee: 0.000003 ETH required (~0.01 USD)");
        
        PlayerState storage player = players[msg.sender];
        bool isNewHighScore = false;
        if (score > player.highScore) {
            player.highScore = score;
            isNewHighScore = true;
            _updateLeaderboard(msg.sender, score);
        }
        emit ScoreSubmitted(msg.sender, score, isNewHighScore);
    }

    function getPlayerState(address account) external view returns (uint256 coinBalance, uint256 streak, uint256 lastClaimTime, uint256 highScore) {
        PlayerState storage player = players[account];
        return (player.coinBalance, player.streak, player.lastClaimTime, player.highScore);
    }

    function getLeaderboard() external view returns (LeaderboardEntry[10] memory) {
        return leaderboard;
    }

    function _updateLeaderboard(address player, uint256 score) internal {
        // Find if player is already on the leaderboard
        int256 existingIndex = -1;
        for (uint256 i = 0; i < 10; i++) {
            if (leaderboard[i].player == player) {
                existingIndex = int256(i);
                break;
            }
        }

        if (existingIndex != -1) {
            // Update score if it's higher
            if (score > leaderboard[uint256(existingIndex)].score) {
                leaderboard[uint256(existingIndex)].score = score;
            }
        } else {
            // Player is not on the leaderboard, check if score beats the lowest score
            if (score > leaderboard[9].score) {
                leaderboard[9] = LeaderboardEntry(player, score);
            }
        }

        // Sort leaderboard descending using a simple insertion sort
        for (uint256 i = 1; i < 10; i++) {
            LeaderboardEntry memory key = leaderboard[i];
            uint256 j = i;
            while (j > 0 && leaderboard[j - 1].score < key.score) {
                leaderboard[j] = leaderboard[j - 1];
                j = j - 1;
            }
            leaderboard[j] = key;
        }
    }
}
