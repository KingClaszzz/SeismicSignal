// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {SeismicProjectRegistry} from "../src/SeismicProjectRegistry.sol";
import {SeismicProjectVoting} from "../src/SeismicProjectVoting.sol";
import {SeismicTokenRegistry} from "../src/SeismicTokenRegistry.sol";
import {SeismicIntentRegistry} from "../src/SeismicIntentRegistry.sol";
import {SeismicFactory} from "../src/SeismicFactory.sol";
import {SeismicRouter} from "../src/SeismicRouter.sol";
import {SeismicWrappedETH} from "../src/SeismicWrappedETH.sol";
import {ArseiToken} from "../src/ArseiToken.sol";
import {TestSeiUSD} from "../src/TestSeiUSD.sol";

contract DeploySeismicCore is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        address deployer = vm.addr(deployerPrivateKey);

        SeismicProjectRegistry projectRegistry = new SeismicProjectRegistry(deployer);
        SeismicProjectVoting voting = new SeismicProjectVoting(address(projectRegistry));
        SeismicTokenRegistry tokenRegistry = new SeismicTokenRegistry(deployer);
        SeismicIntentRegistry intentRegistry = new SeismicIntentRegistry(deployer);
        SeismicFactory factory = new SeismicFactory(deployer, address(tokenRegistry));
        SeismicWrappedETH weth = new SeismicWrappedETH();
        SeismicRouter router = new SeismicRouter(address(factory), address(weth));

        ArseiToken arsei = new ArseiToken(deployer);
        TestSeiUSD susd = new TestSeiUSD(deployer);

        tokenRegistry.registerToken(
            address(weth),
            "WETH",
            "Seismic Wrapped Ether",
            18,
            SeismicTokenRegistry.TokenType.ERC20_PUBLIC
        );
        tokenRegistry.registerToken(
            address(arsei),
            "ARSEI",
            "Arlor Seismic",
            18,
            SeismicTokenRegistry.TokenType.ERC20_PUBLIC
        );
        tokenRegistry.registerToken(
            address(susd),
            "sUSD",
            "Test Seismic USD",
            18,
            SeismicTokenRegistry.TokenType.ERC20_PUBLIC
        );

        factory.createPair(address(weth), address(arsei));
        factory.createPair(address(arsei), address(susd));

        vm.stopBroadcast();

        console2.log("SeismicProjectRegistry:", address(projectRegistry));
        console2.log("SeismicProjectVoting:", address(voting));
        console2.log("SeismicTokenRegistry:", address(tokenRegistry));
        console2.log("SeismicIntentRegistry:", address(intentRegistry));
        console2.log("SeismicFactory:", address(factory));
        console2.log("SeismicRouter:", address(router));
        console2.log("SeismicWrappedETH:", address(weth));
        console2.log("ArseiToken:", address(arsei));
        console2.log("TestSeiUSD:", address(susd));
    }
}
