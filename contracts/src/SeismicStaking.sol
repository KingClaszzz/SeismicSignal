// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {Ownable} from "./common/Ownable.sol";

/**
 * @dev Simple ReentrancyGuard to keep the contract lightweight for Seismic.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @title SeismicStaking
 * @dev A standard staking rewards contract for the Seismic ecosystem.
 * Users stake ARSEI and earn ARSEI as a "signal reward".
 * Implementation follows the standard Synthetix StakingRewards pattern.
 */
contract SeismicStaking is ReentrancyGuard, Ownable {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardsToken;

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 7 days;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    struct UnstakeRequest {
        uint256 amount;
        uint256 releaseTime;
        bool claimed;
    }

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => UnstakeRequest[]) public unstakeRequests;

    uint256 public constant UNSTAKING_PERIOD = 14 days;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    event Staked(address indexed user, uint256 amount);
    event UnstakeRequested(address indexed user, uint256 index, uint256 amount, uint256 releaseTime);
    event UnstakeCancelled(address indexed user, uint256 index, uint256 amount);
    event UnstakeClaimed(address indexed user, uint256 index, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event RewardAdded(uint256 reward);

    constructor(
        address _owner,
        address _stakingToken,
        address _rewardsToken
    ) Ownable(_owner) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function getUnstakeRequests(address account) external view returns (UnstakeRequest[] memory) {
        return unstakeRequests[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / _totalSupply);
    }

    function earned(address account) public view returns (uint256) {
        return
            ((_balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply += amount;
        _balances[msg.sender] += amount;
        
        _safeTransferFrom(stakingToken, msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Initiate the 14-day unstaking cooldown.
     * Tokens moved to this state do NOT earn rewards.
     */
    function requestUnstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(_balances[msg.sender] >= amount, "Insufficient staked balance");

        _balances[msg.sender] -= amount;
        _totalSupply -= amount;

        unstakeRequests[msg.sender].push(UnstakeRequest({
            amount: amount,
            releaseTime: block.timestamp + UNSTAKING_PERIOD,
            claimed: false
        }));

        emit UnstakeRequested(msg.sender, unstakeRequests[msg.sender].length - 1, amount, block.timestamp + UNSTAKING_PERIOD);
    }

    /**
     * @dev Cancel a pending unstake request and return tokens to active staking.
     */
    function cancelUnstake(uint256 index) external nonReentrant updateReward(msg.sender) {
        require(index < unstakeRequests[msg.sender].length, "Invalid index");
        UnstakeRequest storage request = unstakeRequests[msg.sender][index];
        require(!request.claimed, "Already claimed");

        uint256 amount = request.amount;
        request.claimed = true; // Use claimed as a "processed" flag
        request.amount = 0;

        _balances[msg.sender] += amount;
        _totalSupply += amount;

        emit UnstakeCancelled(msg.sender, index, amount);
    }

    /**
     * @dev Claim tokens after the 14-day cooldown has passed.
     */
    function claimUnstake(uint256 index) external nonReentrant {
        require(index < unstakeRequests[msg.sender].length, "Invalid index");
        UnstakeRequest storage request = unstakeRequests[msg.sender][index];
        require(!request.claimed, "Already claimed");
        require(block.timestamp >= request.releaseTime, "Cooldown not finished");

        uint256 amount = request.amount;
        request.claimed = true;
        request.amount = 0;

        _safeTransfer(stakingToken, msg.sender, amount);

        emit UnstakeClaimed(msg.sender, index, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            _safeTransfer(rewardsToken, msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        // Ensure the provided reward amount is actually in the contract.
        // This prevents the reward rate from being misleadingly high.
        uint256 balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= balance / rewardsDuration, "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== PRIVATE HELPERS ========== */

    function _safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    function _safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferFrom failed");
    }
}
