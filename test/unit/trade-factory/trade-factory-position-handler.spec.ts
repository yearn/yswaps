import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { evm, wallet } from '@test-utils';
import { contract, given, then, when } from '@test-utils/bdd';
import { abi as swapperABI } from '@artifacts/solidity/contracts/swappers/Swapper.sol/ISwapper.json';
import { FakeContract, MockContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { BigNumber, constants, utils } from 'ethers';
import Web3 from 'web3';
import { ISwapper, TradeFactoryPositionsHandlerForTest, TradeFactoryPositionsHandlerForTest__factory } from '@typechained';

contract.skip('TradeFactoryPositionsHandler', () => {
  let deployer: SignerWithAddress;
  let masterAdmin: SignerWithAddress;
  let strategy: SignerWithAddress;
  let swapperAdder: SignerWithAddress;
  let swapperSetter: SignerWithAddress;
  let strategyModifier: SignerWithAddress;
  let positionsHandlerFactory: MockContractFactory<TradeFactoryPositionsHandlerForTest__factory>;
  let positionsHandler: MockContract<TradeFactoryPositionsHandlerForTest>;
  let asyncSwapper: FakeContract<ISwapper>;
  let snapshotId: string;

  const MASTER_ADMIN_ROLE: string = new Web3().utils.soliditySha3('MASTER_ADMIN') as string;
  const STRATEGY_ROLE: string = new Web3().utils.soliditySha3('STRATEGY') as string;
  const STRATEGY_MODIFIER_ROLE: string = new Web3().utils.soliditySha3('STRATEGY_MODIFIER') as string;

  before(async () => {
    [deployer, masterAdmin, swapperAdder, swapperSetter, strategyModifier, strategy] = await ethers.getSigners();
    positionsHandlerFactory = await smock.mock<TradeFactoryPositionsHandlerForTest__factory>(
      'solidity/contracts/for-test/TradeFactory/TradeFactoryPositionsHandler.sol:TradeFactoryPositionsHandlerForTest',
      strategy
    );
    positionsHandler = await positionsHandlerFactory.deploy(
      masterAdmin.address,
      swapperAdder.address,
      swapperSetter.address,
      strategyModifier.address
    );
    asyncSwapper = await smock.fake<ISwapper>(swapperABI);
    await positionsHandler.connect(swapperAdder).addSwappers([asyncSwapper.address]);
    await positionsHandler.connect(strategyModifier).grantRole(STRATEGY_ROLE, strategy.address);
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('constructor', () => {
    when('strategy adder is zero address', () => {
      then('tx is reverted with message');
    });
    when('trades modifier is zero address', () => {
      then('tx is reverted with message');
    });
    when('all arguments are valid', () => {
      then('strategy adder is set');
      then('trades modifier is set');
      then('admin role of strategy is strategy adder', async () => {
        expect(await positionsHandler.getRoleAdmin(STRATEGY_ROLE)).to.equal(STRATEGY_MODIFIER_ROLE);
      });
      then('admin role of strategy admin is master admin', async () => {
        expect(await positionsHandler.getRoleAdmin(STRATEGY_MODIFIER_ROLE)).to.equal(MASTER_ADMIN_ROLE);
      });
    });
  });
});
