// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Ownable {
    address public owner;

    error NotOwner();
    error ZeroAddressOwner();

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddressOwner();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

