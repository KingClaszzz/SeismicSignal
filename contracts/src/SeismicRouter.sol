// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IWETH} from "./interfaces/IWETH.sol";
import {SeismicFactory} from "./SeismicFactory.sol";
import {SeismicPair} from "./SeismicPair.sol";

contract SeismicRouter {
    SeismicFactory public immutable factory;
    address public immutable wrappedNative;

    error PairNotFound();
    error InvalidPath();
    error Expired();
    error InsufficientAAmount();
    error InsufficientBAmount();
    error InsufficientOutputAmount();
    error TransferFailed();
    error InvalidWrappedNative();
    error InvalidRecipient();

    constructor(address factoryAddress, address wrappedNativeAddress) {
        factory = SeismicFactory(factoryAddress);
        wrappedNative = wrappedNativeAddress;
    }

    receive() external payable {
        if (msg.sender != wrappedNative) revert InvalidWrappedNative();
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        if (block.timestamp > deadline) revert Expired();

        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) revert PairNotFound();

        (uint112 reserveA, uint112 reserveB) = _getReserves(tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint256 amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                if (amountBOptimal < amountBMin) revert InsufficientBAmount();
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                if (amountAOptimal < amountAMin) revert InsufficientAAmount();
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }

        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = SeismicPair(pair).mint(to);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        if (block.timestamp > deadline) revert Expired();

        address pair = factory.getPair(token, wrappedNative);
        if (pair == address(0)) revert PairNotFound();

        (uint112 reserveToken, uint112 reserveETH) = _getReserves(token, wrappedNative);

        if (reserveToken == 0 && reserveETH == 0) {
            amountToken = amountTokenDesired;
            amountETH = msg.value;
        } else {
            uint256 amountETHOptimal = quote(amountTokenDesired, reserveToken, reserveETH);
            if (amountETHOptimal <= msg.value) {
                if (amountETHOptimal < amountETHMin) revert InsufficientBAmount();
                amountToken = amountTokenDesired;
                amountETH = amountETHOptimal;
            } else {
                uint256 amountTokenOptimal = quote(msg.value, reserveETH, reserveToken);
                if (amountTokenOptimal < amountTokenMin) revert InsufficientAAmount();
                amountToken = amountTokenOptimal;
                amountETH = msg.value;
            }
        }

        _safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(wrappedNative).deposit{value: amountETH}();
        _safeTransfer(wrappedNative, pair, amountETH);
        liquidity = SeismicPair(pair).mint(to);

        if (msg.value > amountETH) {
            _safeTransferETH(msg.sender, msg.value - amountETH);
        }
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        if (block.timestamp > deadline) revert Expired();

        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) revert PairNotFound();

        _safeTransferFrom(pair, msg.sender, pair, liquidity);

        (uint256 amount0, uint256 amount1) = SeismicPair(pair).burn(to);
        (address token0,) = _sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);

        if (amountA < amountAMin) revert InsufficientAAmount();
        if (amountB < amountBMin) revert InsufficientBAmount();
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        if (block.timestamp > deadline) revert Expired();
        if (path.length != 2) revert InvalidPath();

        amounts = getAmountsOut(amountIn, path);
        if (amounts[1] < amountOutMin) revert InsufficientOutputAmount();

        address pair = factory.getPair(path[0], path[1]);
        if (pair == address(0)) revert PairNotFound();

        _safeTransferFrom(path[0], msg.sender, pair, amounts[0]);
        _swap(amounts, path, to);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        if (block.timestamp > deadline) revert Expired();
        if (path.length != 2 || path[0] != wrappedNative) revert InvalidPath();

        amounts = getAmountsOut(msg.value, path);
        if (amounts[1] < amountOutMin) revert InsufficientOutputAmount();

        address pair = factory.getPair(path[0], path[1]);
        if (pair == address(0)) revert PairNotFound();

        IWETH(wrappedNative).deposit{value: amounts[0]}();
        _safeTransfer(wrappedNative, pair, amounts[0]);
        _swap(amounts, path, to);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        if (block.timestamp > deadline) revert Expired();
        if (path.length != 2 || path[1] != wrappedNative) revert InvalidPath();
        if (to == address(0)) revert InvalidRecipient();

        amounts = getAmountsOut(amountIn, path);
        if (amounts[1] < amountOutMin) revert InsufficientOutputAmount();

        address pair = factory.getPair(path[0], path[1]);
        if (pair == address(0)) revert PairNotFound();

        _safeTransferFrom(path[0], msg.sender, pair, amounts[0]);
        _swap(amounts, path, address(this));

        IWETH(wrappedNative).withdraw(amounts[1]);
        _safeTransferETH(to, amounts[1]);
    }

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        amountB = (amountA * reserveB) / reserveA;
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path) public view returns (uint256[] memory amounts) {
        if (path.length != 2) revert InvalidPath();

        amounts = new uint256[](2);
        amounts[0] = amountIn;

        (uint112 reserveIn, uint112 reserveOut) = _getReserves(path[0], path[1]);
        amounts[1] = getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function _swap(uint256[] memory amounts, address[] calldata path, address to) internal {
        address pair = factory.getPair(path[0], path[1]);
        (address token0,) = _sortTokens(path[0], path[1]);
        uint256 amountOut = amounts[1];
        (uint256 amount0Out, uint256 amount1Out) = path[0] == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
        SeismicPair(pair).swap(amount0Out, amount1Out, to);
    }

    function _getReserves(address tokenA, address tokenB) internal view returns (uint112 reserveA, uint112 reserveB) {
        address pair = factory.getPair(tokenA, tokenB);
        if (pair == address(0)) revert PairNotFound();

        (uint112 reserve0, uint112 reserve1,) = SeismicPair(pair).getReserves();
        (address token0,) = _sortTokens(tokenA, tokenB);
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function _sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed();
    }

    function _safeTransferETH(address to, uint256 amount) internal {
        (bool success,) = payable(to).call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
