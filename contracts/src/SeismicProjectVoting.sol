// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISeismicProjectRegistry} from "./interfaces/ISeismicProjectRegistry.sol";

contract SeismicProjectVoting {
    struct VoteState {
        bool hasVoted;
        bool support;
    }

    ISeismicProjectRegistry public immutable registry;

    mapping(uint256 => uint256) public upvotes;
    mapping(uint256 => uint256) public downvotes;
    mapping(uint256 => mapping(address => VoteState)) private projectVotes;

    error InvalidProjectId();
    error VoteNotFound();

    event ProjectVoted(uint256 indexed projectId, address indexed voter, bool support);
    event ProjectVoteRevoked(uint256 indexed projectId, address indexed voter);

    constructor(address registryAddress) {
        registry = ISeismicProjectRegistry(registryAddress);
    }

    function vote(uint256 projectId, bool support) external {
        if (!registry.exists(projectId)) revert InvalidProjectId();

        VoteState storage currentVote = projectVotes[projectId][msg.sender];

        if (currentVote.hasVoted) {
            if (currentVote.support == support) {
                emit ProjectVoted(projectId, msg.sender, support);
                return;
            }

            if (currentVote.support) {
                upvotes[projectId] -= 1;
            } else {
                downvotes[projectId] -= 1;
            }
        }

        currentVote.hasVoted = true;
        currentVote.support = support;

        if (support) {
            upvotes[projectId] += 1;
        } else {
            downvotes[projectId] += 1;
        }

        emit ProjectVoted(projectId, msg.sender, support);
    }

    function revokeVote(uint256 projectId) external {
        if (!registry.exists(projectId)) revert InvalidProjectId();

        VoteState storage currentVote = projectVotes[projectId][msg.sender];
        if (!currentVote.hasVoted) revert VoteNotFound();

        if (currentVote.support) {
            upvotes[projectId] -= 1;
        } else {
            downvotes[projectId] -= 1;
        }

        delete projectVotes[projectId][msg.sender];

        emit ProjectVoteRevoked(projectId, msg.sender);
    }

    function getVote(uint256 projectId, address voter) external view returns (VoteState memory) {
        return projectVotes[projectId][voter];
    }

    function getScore(uint256 projectId) external view returns (int256) {
        return int256(upvotes[projectId]) - int256(downvotes[projectId]);
    }
}

