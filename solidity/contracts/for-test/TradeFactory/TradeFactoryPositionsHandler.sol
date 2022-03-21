// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4 <0.9.0;

import '../../TradeFactory/TradeFactoryPositionsHandler.sol';
import './TradeFactorySwapperHandler.sol';

contract TradeFactoryPositionsHandlerForTest is TradeFactorySwapperHandlerForTest, TradeFactoryPositionsHandler {
  constructor(
    address _masterAdmin,
    address _swapperAdder,
    address _swapperSetter,
    address _strategyModifier
  ) TradeFactoryPositionsHandler(_strategyModifier) TradeFactorySwapperHandlerForTest(_masterAdmin, _swapperAdder, _swapperSetter) {}
}
