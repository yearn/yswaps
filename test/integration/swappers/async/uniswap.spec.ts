import { expect } from 'chai';
import { BigNumber, utils, Wallet } from 'ethers';
import { JsonRpcSigner } from '@ethersproject/providers';
import { evm, wallet } from '@test-utils';
import { then, when } from '@test-utils/bdd';
import { getNodeUrl } from '@utils/env';
import { IERC20, ISwapper, TradeFactory } from '@typechained';
import forkBlockNumber from '@integration/fork-block-numbers';
import uniswapV2, { SwapResponse } from '@scripts/dexes/uniswap-v2';
import { WETH_REGISTRY, UNISWAP_V2_ROUTER_REGISTRY, UNISWAP_V2_FACTORY_REGISTRY } from '@deploy/addresses-registry';
import * as setup from '../setup';

const AMOUNT_IN = utils.parseEther('10000');

describe('Uniswap', function () {
  let yMech: JsonRpcSigner;
  let strategy: Wallet;
  let tradeFactory: TradeFactory;
  let swapper: ISwapper;

  let CRV: IERC20;
  let DAI: IERC20;

  let snapshotId: string;

  let uniswapResponse: SwapResponse;

  when('on ethereum', () => {
    const FORK_BLOCK_NUMBER = forkBlockNumber['ethereum-swappers'];

    const CHAIN_ID = 1;

    const CRV_ADDRESS = '0xD533a949740bb3306d119CC777fa900bA034cd52';
    const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';

    const CRV_WHALE_ADDRESS = '0xd2d43555134dc575bf7279f4ba18809645db0f1d';

    before(async () => {
      strategy = await wallet.generateRandom();

      await evm.reset({
        jsonRpcUrl: getNodeUrl('ethereum'),
        blockNumber: FORK_BLOCK_NUMBER,
      });

      ({
        fromToken: CRV,
        toToken: DAI,
        tradeFactory,
        yMech,
        swapper,
      } = await setup.async({
        chainId: CHAIN_ID,
        fixture: ['Common', 'Ethereum', 'UniswapV2'],
        swapper: 'AsyncUniswapV2',
        fromTokenAddress: CRV_ADDRESS,
        toTokenAddress: DAI_ADDRESS,
        fromTokenWhaleAddress: CRV_WHALE_ADDRESS,
        strategy,
      }));

      uniswapResponse = await uniswapV2.getBestPathEncoded({
        tokenIn: CRV_ADDRESS,
        tokenOut: DAI_ADDRESS,
        amountIn: AMOUNT_IN,
        uniswapV2Router: UNISWAP_V2_ROUTER_REGISTRY.get(CHAIN_ID)!,
        uniswapV2Factory: UNISWAP_V2_FACTORY_REGISTRY.get(CHAIN_ID)!,
        hopTokensToTest: [WETH_REGISTRY.get(CHAIN_ID)!],
        slippage: 3,
      });

      snapshotId = await evm.snapshot.take();
    });

    beforeEach(async () => {
      await evm.snapshot.revert(snapshotId);
    });

    describe('swap', () => {
      let preSwapBalance: BigNumber;
      beforeEach(async () => {
        preSwapBalance = await CRV.balanceOf(strategy.address);
        await tradeFactory.connect(yMech)['execute((address,address,address,uint256,uint256),address,bytes)'](
          {
            _strategy: strategy.address,
            _tokenIn: CRV_ADDRESS,
            _tokenOut: DAI_ADDRESS,
            _amount: AMOUNT_IN,
            _minAmountOut: uniswapResponse.minAmountOut!,
          },
          swapper.address,
          uniswapResponse.data
        );
      });

      then('CRV gets taken from strategy', async () => {
        expect(await CRV.balanceOf(strategy.address)).to.equal(preSwapBalance.sub(AMOUNT_IN));
      });
      then('DAI gets airdropped to strategy', async () => {
        expect(await DAI.balanceOf(strategy.address)).to.be.gt(0);
      });
    });
  });
});
