// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "./common/Ownable.sol";

contract SeismicIntentRegistry is Ownable {
    enum IntentType {
        TRANSFER,
        SWAP
    }

    enum IntentStatus {
        SCHEDULED,
        CANCELLED,
        EXECUTED,
        EXPIRED
    }

    struct Intent {
        uint256 id;
        address owner;
        IntentType intentType;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        address recipient;
        uint64 executeAfter;
        uint32 maxSlippageBps;
        IntentStatus status;
        string metadataURI;
    }

    uint256 public nextIntentId = 1;

    mapping(uint256 => Intent) private intents;
    mapping(address => uint256[]) private intentIdsByOwner;

    error InvalidIntentId();
    error UnauthorizedIntentOwner();
    error InvalidExecutionTime();
    error InvalidRecipient();
    error InvalidAmount();
    error InvalidIntentStatus();

    event TransferIntentCreated(
        uint256 indexed intentId,
        address indexed owner,
        address indexed token,
        uint256 amount,
        address recipient,
        uint64 executeAfter
    );
    event SwapIntentCreated(
        uint256 indexed intentId,
        address indexed owner,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint64 executeAfter
    );
    event IntentCancelled(uint256 indexed intentId, address indexed owner);
    event IntentExecuted(uint256 indexed intentId);
    event IntentExpired(uint256 indexed intentId);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createTransferIntent(
        address token,
        uint256 amount,
        address recipient,
        uint64 executeAfter,
        string calldata metadataURI
    ) external returns (uint256 intentId) {
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        if (executeAfter <= block.timestamp) revert InvalidExecutionTime();

        intentId = _createIntent(
            IntentType.TRANSFER,
            token,
            address(0),
            amount,
            recipient,
            executeAfter,
            0,
            metadataURI
        );

        emit TransferIntentCreated(intentId, msg.sender, token, amount, recipient, executeAfter);
    }

    function createSwapIntent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint64 executeAfter,
        uint32 maxSlippageBps,
        string calldata metadataURI
    ) external returns (uint256 intentId) {
        if (amountIn == 0) revert InvalidAmount();
        if (executeAfter <= block.timestamp) revert InvalidExecutionTime();

        intentId = _createIntent(
            IntentType.SWAP,
            tokenIn,
            tokenOut,
            amountIn,
            address(0),
            executeAfter,
            maxSlippageBps,
            metadataURI
        );

        emit SwapIntentCreated(intentId, msg.sender, tokenIn, tokenOut, amountIn, executeAfter);
    }

    function cancelIntent(uint256 intentId) external {
        Intent storage intent = _getEditableIntent(intentId, msg.sender);
        if (intent.status != IntentStatus.SCHEDULED) revert InvalidIntentStatus();

        intent.status = IntentStatus.CANCELLED;
        emit IntentCancelled(intentId, msg.sender);
    }

    function markExecuted(uint256 intentId) external onlyOwner {
        Intent storage intent = _getIntent(intentId);
        if (intent.status != IntentStatus.SCHEDULED) revert InvalidIntentStatus();

        intent.status = IntentStatus.EXECUTED;
        emit IntentExecuted(intentId);
    }

    function markExpired(uint256 intentId) external onlyOwner {
        Intent storage intent = _getIntent(intentId);
        if (intent.status != IntentStatus.SCHEDULED) revert InvalidIntentStatus();

        intent.status = IntentStatus.EXPIRED;
        emit IntentExpired(intentId);
    }

    function getIntent(uint256 intentId) external view returns (Intent memory) {
        return intents[intentId];
    }

    function getOwnerIntentIds(address ownerAddress) external view returns (uint256[] memory) {
        return intentIdsByOwner[ownerAddress];
    }

    function _createIntent(
        IntentType intentType,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient,
        uint64 executeAfter,
        uint32 maxSlippageBps,
        string calldata metadataURI
    ) internal returns (uint256 intentId) {
        intentId = nextIntentId++;

        intents[intentId] = Intent({
            id: intentId,
            owner: msg.sender,
            intentType: intentType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            recipient: recipient,
            executeAfter: executeAfter,
            maxSlippageBps: maxSlippageBps,
            status: IntentStatus.SCHEDULED,
            metadataURI: metadataURI
        });

        intentIdsByOwner[msg.sender].push(intentId);
    }

    function _getEditableIntent(uint256 intentId, address sender) internal view returns (Intent storage intent) {
        intent = _getIntent(intentId);
        if (intent.owner != sender) revert UnauthorizedIntentOwner();
    }

    function _getIntent(uint256 intentId) internal view returns (Intent storage intent) {
        intent = intents[intentId];
        if (intent.id == 0) revert InvalidIntentId();
    }
}
