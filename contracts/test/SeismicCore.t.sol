// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SeismicProjectRegistry} from "../src/SeismicProjectRegistry.sol";
import {SeismicProjectVoting} from "../src/SeismicProjectVoting.sol";
import {SeismicTokenRegistry} from "../src/SeismicTokenRegistry.sol";
import {SeismicIntentRegistry} from "../src/SeismicIntentRegistry.sol";
import {SeismicFactory} from "../src/SeismicFactory.sol";
import {SeismicRouter} from "../src/SeismicRouter.sol";
import {SeismicPair} from "../src/SeismicPair.sol";
import {SeismicWrappedETH} from "../src/SeismicWrappedETH.sol";
import {ArseiToken} from "../src/ArseiToken.sol";
import {TestSeiUSD} from "../src/TestSeiUSD.sol";

contract SeismicCoreTest is Test {
    address internal owner = address(0xA11CE);
    address internal alice = address(0xB0B);
    address internal bob = address(0xCAFE);

    SeismicProjectRegistry internal projectRegistry;
    SeismicProjectVoting internal voting;
    SeismicTokenRegistry internal tokenRegistry;
    SeismicIntentRegistry internal intentRegistry;
    SeismicFactory internal factory;
    SeismicRouter internal router;
    SeismicWrappedETH internal weth;
    ArseiToken internal arsei;
    TestSeiUSD internal susd;

    function setUp() external {
        vm.startPrank(owner);

        projectRegistry = new SeismicProjectRegistry(owner);
        voting = new SeismicProjectVoting(address(projectRegistry));
        tokenRegistry = new SeismicTokenRegistry(owner);
        intentRegistry = new SeismicIntentRegistry(owner);
        factory = new SeismicFactory(owner, address(tokenRegistry));
        weth = new SeismicWrappedETH();
        router = new SeismicRouter(address(factory), address(weth));

        arsei = new ArseiToken(owner);
        susd = new TestSeiUSD(owner);

        arsei.mint(alice, 1_000_000 ether);
        arsei.mint(bob, 1_000_000 ether);
        susd.mint(alice, 1_000_000 ether);
        susd.mint(bob, 1_000_000 ether);

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

        vm.stopPrank();
    }

    function testProjectSubmissionAndVotingFlow() external {
        vm.prank(alice);
        uint256 projectId = projectRegistry.submitProject(
            "Arsei Swap",
            "arsei-swap",
            "defi",
            "https://swap.arsei.test",
            "ipfs://arsei-metadata"
        );

        vm.prank(alice);
        voting.vote(projectId, true);

        vm.prank(bob);
        voting.vote(projectId, false);

        assertEq(projectId, 1);
        assertEq(voting.upvotes(projectId), 1);
        assertEq(voting.downvotes(projectId), 1);
        assertEq(voting.getScore(projectId), 0);
    }

    function testIntentCreationFlow() external {
        vm.prank(alice);
        uint256 intentId = intentRegistry.createSwapIntent(
            address(arsei),
            address(susd),
            10 ether,
            uint64(block.timestamp + 1 days),
            100,
            "ipfs://intent-swap"
        );

        SeismicIntentRegistry.Intent memory intent = intentRegistry.getIntent(intentId);

        assertEq(intent.id, 1);
        assertEq(intent.owner, alice);
        assertEq(intent.tokenIn, address(arsei));
        assertEq(intent.tokenOut, address(susd));
        assertEq(intent.amountIn, 10 ether);
        assertEq(uint256(intent.executeAfter), block.timestamp + 1 days);
        assertEq(intent.maxSlippageBps, 100);
    }

    function testAddLiquidityAndSwap() external {
        address pair = factory.getPair(address(arsei), address(susd));

        vm.startPrank(alice);
        arsei.approve(address(router), 1000 ether);
        susd.approve(address(router), 1000 ether);

        (, , uint256 liquidity) = router.addLiquidity(
            address(arsei),
            address(susd),
            1000 ether,
            1000 ether,
            1000 ether,
            1000 ether,
            alice,
            block.timestamp + 1 hours
        );
        vm.stopPrank();

        assertGt(liquidity, 0);

        vm.startPrank(bob);
        arsei.approve(address(router), 100 ether);

        address[] memory path = new address[](2);
        path[0] = address(arsei);
        path[1] = address(susd);

        uint256 susdBefore = susd.balanceOf(bob);
        router.swapExactTokensForTokens(
            100 ether,
            1,
            path,
            bob,
            block.timestamp + 1 hours
        );
        uint256 susdAfter = susd.balanceOf(bob);
        vm.stopPrank();

        assertGt(susdAfter, susdBefore);

        (uint112 reserve0, uint112 reserve1,) = SeismicPair(pair).getReserves();
        assertGt(uint256(reserve0), 0);
        assertGt(uint256(reserve1), 0);
    }

    function testAddLiquidityETHAndSwapETHForArsei() external {
        address pair = factory.getPair(address(weth), address(arsei));

        vm.deal(alice, 100 ether);
        vm.deal(bob, 25 ether);

        vm.startPrank(alice);
        arsei.approve(address(router), 20_000 ether);
        (, , uint256 liquidity) = router.addLiquidityETH{value: 20 ether}(
            address(arsei),
            20_000 ether,
            20_000 ether,
            20 ether,
            alice,
            block.timestamp + 1 hours
        );
        vm.stopPrank();

        assertGt(liquidity, 0);

        vm.startPrank(bob);
        address[] memory path = new address[](2);
        path[0] = address(weth);
        path[1] = address(arsei);

        uint256 arseiBefore = arsei.balanceOf(bob);
        router.swapExactETHForTokens{value: 1 ether}(
            1,
            path,
            bob,
            block.timestamp + 1 hours
        );
        uint256 arseiAfter = arsei.balanceOf(bob);
        vm.stopPrank();

        assertGt(arseiAfter, arseiBefore);

        (uint112 reserve0, uint112 reserve1,) = SeismicPair(pair).getReserves();
        assertGt(uint256(reserve0), 0);
        assertGt(uint256(reserve1), 0);
    }
}
