// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "./common/Ownable.sol";

contract SeismicTokenRegistry is Ownable {
    enum TokenType {
        ERC20_PUBLIC,
        SRC20_PRIVATE
    }

    struct VerifiedToken {
        address token;
        string symbol;
        string name;
        uint8 decimals;
        TokenType tokenType;
        bool enabled;
        bool featured;
    }

    address[] private tokenList;
    mapping(address => VerifiedToken) private tokens;

    error TokenAlreadyRegistered();
    error TokenNotRegistered();
    error ZeroTokenAddress();
    error EmptyField(string field);

    event TokenRegistered(address indexed token, string symbol, TokenType tokenType);
    event TokenStatusUpdated(address indexed token, bool enabled, bool featured);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerToken(
        address token,
        string calldata symbol,
        string calldata name,
        uint8 decimals,
        TokenType tokenType
    ) external onlyOwner {
        if (token == address(0)) revert ZeroTokenAddress();
        if (tokens[token].token != address(0)) revert TokenAlreadyRegistered();
        _requireNonEmpty(symbol, "symbol");
        _requireNonEmpty(name, "name");

        tokens[token] = VerifiedToken({
            token: token,
            symbol: symbol,
            name: name,
            decimals: decimals,
            tokenType: tokenType,
            enabled: true,
            featured: false
        });

        tokenList.push(token);

        emit TokenRegistered(token, symbol, tokenType);
    }

    function setTokenStatus(address token, bool enabled, bool featured) external onlyOwner {
        if (tokens[token].token == address(0)) revert TokenNotRegistered();

        VerifiedToken storage verifiedToken = tokens[token];
        verifiedToken.enabled = enabled;
        verifiedToken.featured = featured;

        emit TokenStatusUpdated(token, enabled, featured);
    }

    function getToken(address token) external view returns (VerifiedToken memory) {
        if (tokens[token].token == address(0)) revert TokenNotRegistered();
        return tokens[token];
    }

    function getAllTokens() external view returns (VerifiedToken[] memory) {
        VerifiedToken[] memory results = new VerifiedToken[](tokenList.length);

        for (uint256 i = 0; i < tokenList.length; i++) {
            results[i] = tokens[tokenList[i]];
        }

        return results;
    }

    function totalTokens() external view returns (uint256) {
        return tokenList.length;
    }

    function isRegistered(address token) external view returns (bool) {
        return tokens[token].token != address(0);
    }

    function isEnabledToken(address token) external view returns (bool) {
        return tokens[token].token != address(0) && tokens[token].enabled;
    }

    function _requireNonEmpty(string calldata value, string memory field) internal pure {
        if (bytes(value).length == 0) revert EmptyField(field);
    }
}
