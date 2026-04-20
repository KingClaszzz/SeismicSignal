// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISeismicProjectRegistry {
    function exists(uint256 projectId) external view returns (bool);
}

