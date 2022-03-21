import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { behaviours, contracts, erc20, evm, wallet } from '@test-utils';
import { contract, given, then, when } from '@test-utils/bdd';
import { constants, utils } from 'ethers';
import ERC20Data from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { IERC20, AsyncSwapperForTest, AsyncSwapperForTest__factory, ERC20ForTest } from '@typechained';
import { FakeContract, MockContract, smock } from '@defi-wonderland/smock';

contract.skip('AsyncSwapper', () => {
  let governor: SignerWithAddress;
  let tradeFactory: SignerWithAddress;
  let swapperFactory: AsyncSwapperForTest__factory;
  let swapper: AsyncSwapperForTest;
  let snapshotId: string;

  before(async () => {
    [governor, tradeFactory] = await ethers.getSigners();
    swapperFactory = await ethers.getContractFactory<AsyncSwapperForTest__factory>(
      'solidity/contracts/for-test/swappers/AsyncSwapper.sol:AsyncSwapperForTest'
    );
    swapper = await swapperFactory.deploy(governor.address, tradeFactory.address);
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('constructor', () => {
    when('data is valid', () => {
      let deploymentTx: TransactionResponse;
      let deploymentContract: AsyncSwapperForTest;
      given(async () => {
        const deployment = await contracts.deploy(swapperFactory, [governor.address, tradeFactory.address]);
        deploymentTx = deployment.tx as TransactionResponse;
        deploymentContract = deployment.contract! as AsyncSwapperForTest;
      });
      then('governor is set', async () => {
        expect(await deploymentContract.governor()).to.be.equal(governor.address);
      });
      then('trade factory is set', async () => {
        expect(await deploymentContract.tradeFactory()).to.be.equal(tradeFactory.address);
      });
    });
  });

  describe('swap', () => {
    let tokenIn: ERC20ForTest;
    let tokenOut: FakeContract<IERC20>;
    let receiver = wallet.generateRandomAddress();
    const amount = utils.parseEther('10');
    const minAmountOut = utils.parseEther('100');
    const data = ethers.utils.defaultAbiCoder.encode(['uint256'], [constants.MaxUint256]);
    given(async () => {
      tokenIn = await erc20.deploy({
        initialAccount: tradeFactory.address,
        initialAmount: amount,
        name: 'Token In',
        symbol: 'TI',
      });
      tokenOut = await smock.fake<IERC20>(ERC20Data);
      await tokenIn.connect(tradeFactory).approve(swapper.address, amount);
    });
    // behaviours.shouldBeExecutableOnlyByTradeFactory({
    //   contract: () => swapper,
    //   funcAndSignature: 'swap(address,address,address,uint256,uint256,bytes)',
    //   params: [constants.AddressZero, constants.AddressZero, constants.AddressZero, constants.Zero, constants.Zero, '0x'],
    //   tradeFactory: () => tradeFactory,
    // });
    when('receiver is zero address', () => {
      let tx: Promise<TransactionResponse>;
      given(async () => {
        tx = swapper
          .connect(tradeFactory)
          .swap(constants.AddressZero, wallet.generateRandomAddress(), constants.AddressZero, constants.One, constants.One, '0x');
      });
      then('tx is reverted with reason', async () => {
        await expect(tx).to.be.revertedWith('ZeroAddress()');
      });
    });
    when('token in is zero address', () => {
      let tx: Promise<TransactionResponse>;
      given(async () => {
        tx = swapper
          .connect(tradeFactory)
          .swap(wallet.generateRandomAddress(), constants.AddressZero, wallet.generateRandomAddress(), constants.One, constants.One, '0x');
      });
      then('tx is reverted with reason', async () => {
        await expect(tx).to.be.revertedWith('ZeroAddress()');
      });
    });
    when('token out is zero address', () => {
      let tx: Promise<TransactionResponse>;
      given(async () => {
        const args = [wallet.generateRandomAddress(), wallet.generateRandomAddress(), constants.AddressZero, constants.One, constants.One];
        tx = swapper
          .connect(tradeFactory)
          .swap(wallet.generateRandomAddress(), wallet.generateRandomAddress(), constants.AddressZero, constants.One, constants.One, '0x');
      });
      then('tx is reverted with reason', async () => {
        await expect(tx).to.be.revertedWith('ZeroAddress()');
      });
    });
    when('amount is zero', () => {
      let tx: Promise<TransactionResponse>;
      given(async () => {
        tx = swapper
          .connect(tradeFactory)
          .swap(
            wallet.generateRandomAddress(),
            wallet.generateRandomAddress(),
            wallet.generateRandomAddress(),
            constants.Zero,
            constants.One,
            '0x'
          );
      });
      then('tx is reverted with reason', async () => {
        await expect(tx).to.be.revertedWith('ZeroAmount()');
      });
    });
    when('min amount out is zero', () => {
      let tx: Promise<TransactionResponse>;
      given(async () => {
        tx = swapper
          .connect(tradeFactory)
          .swap(
            wallet.generateRandomAddress(),
            wallet.generateRandomAddress(),
            wallet.generateRandomAddress(),
            constants.One,
            constants.Zero,
            '0x'
          );
      });
      then('tx is reverted with reason', async () => {
        await expect(tx).to.be.revertedWith('ZeroAmount()');
      });
    });
    when('min amount out was not returned', () => {
      let tx: Promise<TransactionResponse>;
      given(async () => {
        tokenOut.balanceOf.returnsAtCall(0, 0);
        tokenOut.balanceOf.returnsAtCall(1, minAmountOut.sub(1));
        tx = swapper.connect(tradeFactory).swap(receiver, tokenIn.address, tokenOut.address, amount, minAmountOut, data);
      });
      then('tx is reverted with reason', async () => {
        await expect(tx).to.be.revertedWith('InvalidAmountOut()');
      });
    });
    when('everything is valid', () => {
      let swapTx: TransactionResponse;
      const receivedAmount = utils.parseEther('69');
      given(async () => {
        tokenOut.balanceOf.returnsAtCall(0, 0);
        tokenOut.balanceOf.returnsAtCall(1, minAmountOut);
        await swapper.setReceivedAmount(receivedAmount);
        swapTx = await swapper.connect(tradeFactory).swap(receiver, tokenIn.address, tokenOut.address, amount, minAmountOut, data);
      });
      then('checks that tokens were sent to receiver', async () => {
        expect(tokenOut.balanceOf.atCall(0)).to.have.been.calledWith(receiver);
        expect(tokenOut.balanceOf.atCall(1)).to.have.been.calledWith(receiver);
      });
      then('executes internal swap', async () => {
        await expect(swapTx).to.emit(swapper, 'MyInternalExecuteSwap').withArgs(receiver, tokenIn.address, tokenOut.address, amount, data);
      });
      then('emits event with correct information', async () => {
        await expect(swapTx)
          .to.emit(swapper, 'Swapped')
          .withArgs(receiver, tokenIn.address, tokenOut.address, amount, minAmountOut, receivedAmount, data);
      });
    });
  });
});
