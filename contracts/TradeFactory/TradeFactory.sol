// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

import '@lbertenasco/contract-utils/contracts/utils/CollectableDust.sol';
import '@lbertenasco/contract-utils/contracts/utils/Governable.sol';

import '../utils/Machinery.sol';

import './TradeFactoryPositionsHandler.sol';
import './TradeFactoryExecutor.sol';

interface ITradeFactory is ITradeFactoryExecutor, ITradeFactoryPositionsHandler {}

contract TradeFactory is TradeFactoryPositionsHandler, TradeFactoryExecutor, ITradeFactory, Governable, Machinery, CollectableDust {
  using SafeERC20 for IERC20;
  using EnumerableSet for EnumerableSet.UintSet;
  using EnumerableSet for EnumerableSet.AddressSet;

  constructor(
    address _governor,
    address _mechanicsRegistry,
    address _swapperRegistry
  ) Governable(_governor) Machinery(_mechanicsRegistry) TradeFactoryPositionsHandler(_swapperRegistry) {}

  // TradeFactoryExecutor

  function execute(uint256 _id) external override onlyMechanic returns (uint256 _receivedAmount) {
    _receivedAmount = _execute(_id);
  }

  function expire(uint256 _id) external override onlyMechanic returns (uint256 _freedAmount) {
    _freedAmount = _expire(_id);
  }

  // Machinery

  function setMechanicsRegistry(address _mechanicsRegistry) external override onlyGovernor {
    _setMechanicsRegistry(_mechanicsRegistry);
  }

  // Governable

  function setPendingGovernor(address _pendingGovernor) external override onlyGovernor {
    _setPendingGovernor(_pendingGovernor);
  }

  function acceptGovernor() external override onlyPendingGovernor {
    _acceptGovernor();
  }

  // Collectable Dust

  function sendDust(
    address _to,
    address _token,
    uint256 _amount
  ) external virtual override onlyGovernor {
    _sendDust(_to, _token, _amount);
  }
}