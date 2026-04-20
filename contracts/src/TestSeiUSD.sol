// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockERC20} from "./MockERC20.sol";

contract TestSeiUSD is MockERC20 {
    uint8 public constant TOKEN_DECIMALS = 18;
    string public constant TOKEN_NAME = "Test Seismic USD";
    string public constant TOKEN_SYMBOL = "sUSD";

    constructor(address initialOwner)
        MockERC20(initialOwner, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS)
    {}
}

