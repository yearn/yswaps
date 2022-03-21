import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { abi as machineryABI } from '@yearn-mechanics/contract-utils/artifacts/solidity/interfaces/utils/IMachinery.sol/IMachinery.json';
import { abi as IERC20ABI } from '@artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json';
import { abi as asyncSwapperABI } from '@artifacts/solidity/contracts/swappers/async/AsyncSwapper.sol/IAsyncSwapper.json';
import { abi as syncSwapperABI } from '@artifacts/solidity/contracts/swappers/sync/SyncSwapper.sol/ISyncSwapper.json';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { contract, given, then, when } from '@test-utils/bdd';
import { evm, wallet, erc20 } from '@test-utils';
import { BigNumber, constants, utils, Wallet } from 'ethers';
import { FakeContract, MockContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import {
  AsyncSwapper,
  ERC20ForTest,
  IERC20,
  Machinery,
  SyncSwapper,
  TradeFactoryExecutorForTest,
  TradeFactoryExecutorForTest__factory,
} from '@typechained';

chai.use(smock.matchers);

contract.skip('TradeFactoryExecutor', () => {
  let masterAdmin: SignerWithAddress;
  let strategy: SignerWithAddress;
  let swapperAdder: SignerWithAddress;
  let swapperSetter: SignerWithAddress;
  let strategyModifier: SignerWithAddress;
  let mechanic: SignerWithAddress;
  let machinery: FakeContract<Machinery>;
  let asyncSwapper: FakeContract<AsyncSwapper>;
  let syncSwapper: FakeContract<SyncSwapper>;
  let executorFactory: MockContractFactory<TradeFactoryExecutorForTest__factory>;
  let executor: MockContract<TradeFactoryExecutorForTest>;
  let token: ERC20ForTest;
  let snapshotId: string;

  before(async () => {
    [masterAdmin, swapperAdder, swapperSetter, strategyModifier, strategy, mechanic] = await ethers.getSigners();
    executorFactory = await smock.mock<TradeFactoryExecutorForTest__factory>(
      'solidity/contracts/for-test/TradeFactory/TradeFactoryExecutor.sol:TradeFactoryExecutorForTest',
      mechanic
    );
    machinery = await smock.fake<Machinery>(machineryABI);
    asyncSwapper = await smock.fake<AsyncSwapper>(asyncSwapperABI);
    syncSwapper = await smock.fake<SyncSwapper>(syncSwapperABI);
    executor = await executorFactory.deploy(
      masterAdmin.address,
      swapperAdder.address,
      swapperSetter.address,
      strategyModifier.address,
      machinery.address
    );
    token = await erc20.deploy({
      symbol: 'TK',
      name: 'Token',
      initialAccount: strategy.address,
      initialAmount: utils.parseEther('10000'),
    });
    await executor.connect(strategyModifier).grantRole(await executor.STRATEGY(), strategy.address);
    await executor.connect(swapperAdder).addSwappers([asyncSwapper.address, syncSwapper.address]);
    machinery.isMechanic.returns(true);
    asyncSwapper.SWAPPER_TYPE.returns(0);
    syncSwapper.SWAPPER_TYPE.returns(1);
    await executor.connect(swapperSetter).setStrategySyncSwapper(strategy.address, syncSwapper.address);
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('constructor', () => {});

  describe('execute sync', () => {
    const amountIn = utils.parseEther('100');
    const tokenOut = wallet.generateRandomAddress();
    const maxSlippage = BigNumber.from('1000');
    const data = ethers.utils.defaultAbiCoder.encode([], []);
    // TODO: ONLY STRATEGY
    when('token in is zero address', () => {
      then('tx is reverted with reason', async () => {
        await expect(
          executor
            .connect(strategy)
            ['execute((address,address,uint256,uint256),bytes)'](constants.AddressZero, tokenOut, amountIn, maxSlippage, data)
        ).to.be.revertedWith('ZeroAddress()');
      });
    });
    when('token out is zero address', () => {
      then('tx is reverted with reason', async () => {
        await expect(
          executor
            .connect(strategy)
            ['execute((address,address,uint256,uint256),bytes)'](token.address, constants.AddressZero, amountIn, maxSlippage, data)
        ).to.be.revertedWith('ZeroAddress()');
      });
    });
    when('amount in is zero', () => {
      then('tx is reverted with reason', async () => {
        await expect(
          executor
            .connect(strategy)
            ['execute((address,address,uint256,uint256),bytes)'](token.address, tokenOut, constants.Zero, maxSlippage, data)
        ).to.be.revertedWith('ZeroAmount()');
      });
    });
    when('max slippage is zero', () => {
      then('tx is reverted with reason', async () => {
        await expect(
          executor.connect(strategy)['execute((address,address,uint256,uint256),bytes)'](token.address, tokenOut, amountIn, constants.Zero, data)
        ).to.be.revertedWith('ZeroSlippage()');
      });
    });
    when('is not the first trade being executed of token in & swapper', async () => {
      let executeTx: TransactionResponse;
      let initialStrategyBalance: BigNumber;
      let initialSwapperBalance: BigNumber;
      const receivedAmount = utils.parseEther('92356');
      given(async () => {
        syncSwapper.swap.returns(receivedAmount);
        initialStrategyBalance = await token.balanceOf(strategy.address);
        initialSwapperBalance = await token.balanceOf(syncSwapper.address);
        await token.connect(strategy).approve(executor.address, amountIn);
        executeTx = await executor
          .connect(strategy)
          ['execute((address,address,uint256,uint256),bytes)'](token.address, tokenOut, amountIn, maxSlippage, data);
      });
      then('approve from strategy to trade factory gets reduced', async () => {
        expect(await token.allowance(strategy.address, syncSwapper.address)).to.be.equal(0);
      });
      then('funds get taken from strategy', async () => {
        expect(await token.balanceOf(strategy.address)).to.equal(initialStrategyBalance.sub(amountIn));
      });
      then('moves funds from strategy to swapper', async () => {
        expect(await token.balanceOf(syncSwapper.address)).to.equal(initialSwapperBalance.add(amountIn));
      });
      then('calls swapper swap with correct data', () => {
        expect(syncSwapper.swap).to.have.been.calledWith(strategy.address, token.address, tokenOut, amountIn, maxSlippage, data);
      });
      then('emits event', async () => {
        await expect(executeTx)
          .to.emit(executor, 'SyncTradeExecuted')
          .withArgs(strategy.address, syncSwapper.address, token.address, tokenOut, amountIn, maxSlippage, data, receivedAmount);
      });
    });
  });

  describe('execute async', () => {});
});
