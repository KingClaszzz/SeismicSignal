// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {SeismicStaking} from "../src/SeismicStaking.sol";

contract DeployStaking is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address arseiToken = vm.envAddress("ARSEI_TOKEN_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);

        // Deploy Staking contract
        // We use ARSEI as both the staking token and the rewards token for the bootstrap phase
        SeismicStaking staking = new SeismicStaking(
            deployer,
            arseiToken,
            arseiToken
        );

        vm.stopBroadcast();

        console2.log("SeismicStaking deployed at:", address(staking));
        console2.log("Next steps:");
        console2.log("1. Fund the contract with ARSEI rewards.");
        console2.log("2. Call notifyRewardAmount(uint256) on the Staking contract to start emissions.");
        console2.log("3. Update NEXT_PUBLIC_SEISMIC_STAKING_ADDRESS in your frontend .env.");
    }
}
