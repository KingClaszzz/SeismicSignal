// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "./common/Ownable.sol";
import {ISeismicTokenRegistry} from "./interfaces/ISeismicTokenRegistry.sol";
import {SeismicPair} from "./SeismicPair.sol";

contract SeismicFactory is Ownable {
    ISeismicTokenRegistry public immutable tokenRegistry;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    error IdenticalTokens();
    error ZeroTokenAddress();
    error PairAlreadyExists();
    error TokenNotEnabled();

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 totalPairs);

    constructor(address initialOwner, address tokenRegistryAddress) Ownable(initialOwner) {
        tokenRegistry = ISeismicTokenRegistry(tokenRegistryAddress);
    }

    function createPair(address tokenA, address tokenB) external onlyOwner returns (address pair) {
        if (tokenA == tokenB) revert IdenticalTokens();
        if (tokenA == address(0) || tokenB == address(0)) revert ZeroTokenAddress();
        if (!tokenRegistry.isEnabledToken(tokenA) || !tokenRegistry.isEnabledToken(tokenB)) {
            revert TokenNotEnabled();
        }

        (address token0, address token1) = _sortTokens(tokenA, tokenB);
        if (getPair[token0][token1] != address(0)) revert PairAlreadyExists();

        pair = address(new SeismicPair());
        SeismicPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }
}

