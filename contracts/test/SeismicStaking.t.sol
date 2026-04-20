// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SeismicStaking} from "../src/SeismicStaking.sol";
import {ArseiToken} from "../src/ArseiToken.sol";

contract SeismicStakingTest is Test {
    SeismicStaking public staking;
    ArseiToken public arsei;

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);

    function setUp() public {
        vm.startPrank(owner);
        arsei = new ArseiToken(owner);
        staking = new SeismicStaking(owner, address(arsei), address(arsei));
        
        // Feed the staking contract with some rewards
        arsei.mint(address(staking), 10000 ether);
        staking.notifyRewardAmount(7000 ether); // 1000 ether per day for 7 days
        vm.stopPrank();

        // Give some tokens to users
        vm.startPrank(owner);
        arsei.mint(user1, 1000 ether);
        arsei.mint(user2, 1000 ether);
        vm.stopPrank();
    }

    function testStake() public {
        vm.startPrank(user1);
        arsei.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        vm.stopPrank();

        assertEq(staking.balanceOf(user1), 100 ether);
        assertEq(staking.totalSupply(), 100 ether);
    }

    function testUnstakeRequest() public {
        vm.startPrank(user1);
        arsei.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        
        staking.requestUnstake(40 ether);
        vm.stopPrank();

        assertEq(staking.balanceOf(user1), 60 ether);
        assertEq(staking.totalSupply(), 60 ether);

        SeismicStaking.UnstakeRequest[] memory reqs = staking.getUnstakeRequests(user1);
        assertEq(reqs.length, 1);
        assertEq(reqs[0].amount, 40 ether);
        assertEq(reqs[0].releaseTime, block.timestamp + 14 days);
        assertEq(reqs[0].claimed, false);
    }

    function testCancelUnstake() public {
        vm.startPrank(user1);
        arsei.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        
        staking.requestUnstake(40 ether);
        staking.cancelUnstake(0);
        vm.stopPrank();

        assertEq(staking.balanceOf(user1), 100 ether);
        assertEq(staking.totalSupply(), 100 ether);

        SeismicStaking.UnstakeRequest[] memory reqs = staking.getUnstakeRequests(user1);
        assertEq(reqs[0].amount, 0); // Amount set to 0 on cancel
    }

    function testClaimUnstakeCooldown() public {
        vm.startPrank(user1);
        arsei.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        staking.requestUnstake(40 ether);

        // Try to claim immediately - should fail
        vm.expectRevert("Release time not reached");
        staking.claimUnstake(0);

        // Fast forward 13 days - should still fail
        skip(13 days);
        vm.expectRevert("Release time not reached");
        staking.claimUnstake(0);

        // Fast forward to 14 days - should succeed
        skip(1 days);
        uint256 balanceBefore = arsei.balanceOf(user1);
        staking.claimUnstake(0);
        uint256 balanceAfter = arsei.balanceOf(user1);

        assertEq(balanceAfter - balanceBefore, 40 ether);
        vm.stopPrank();
    }

    function testRewardsStopOnUnstakeRequest() public {
        vm.startPrank(user1);
        arsei.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        vm.stopPrank();

        skip(1 days);
        uint256 earnedBefore = staking.earned(user1);
        
        vm.startPrank(user1);
        staking.requestUnstake(100 ether);
        vm.stopPrank();

        skip(1 days);
        uint256 earnedAfter = staking.earned(user1);

        // Since balance is now 0, no new rewards should be earned
        assertEq(earnedAfter, earnedBefore);
    }

    function testMultipleRequests() public {
        vm.startPrank(user1);
        arsei.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        
        staking.requestUnstake(10 ether);
        skip(1 days);
        staking.requestUnstake(20 ether);
        vm.stopPrank();

        SeismicStaking.UnstakeRequest[] memory reqs = staking.getUnstakeRequests(user1);
        assertEq(reqs.length, 2);
        assertEq(reqs[0].amount, 10 ether);
        assertEq(reqs[1].amount, 20 ether);
        assertEq(reqs[1].releaseTime, reqs[0].releaseTime + 1 days);
    }
}
