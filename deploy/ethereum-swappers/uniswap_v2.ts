import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { shouldVerifyContract } from '@utils/deploy';
import { UNISWAP_V2_FACTORY_REGISTRY, UNISWAP_V2_ROUTER_REGISTRY, WETH_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const WETH = WETH_REGISTRY.get(1);

  const UNISWAP_V2_FACTORY = UNISWAP_V2_FACTORY_REGISTRY.get(1);

  const UNISWAP_V2_ROUTER = UNISWAP_V2_ROUTER_REGISTRY.get(1);

  const asyncDeploy = await hre.deployments.deploy('AsyncUniswapV2', {
    contract: 'solidity/contracts/swappers/async/UniswapV2Swapper.sol:UniswapV2Swapper',
    from: deployer,
    args: [governor, tradeFactory.address, UNISWAP_V2_FACTORY, UNISWAP_V2_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(asyncDeploy)) {
    await hre.run('verify:verify', {
      address: asyncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, UNISWAP_V2_FACTORY, UNISWAP_V2_ROUTER],
    });
  }

  const syncDeploy = await hre.deployments.deploy('SyncUniswapV2', {
    contract: 'solidity/contracts/swappers/sync/UniswapV2Swapper.sol:UniswapV2Swapper',
    from: deployer,
    args: [governor, tradeFactory.address, WETH, UNISWAP_V2_FACTORY, UNISWAP_V2_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(syncDeploy)) {
    await hre.run('verify:verify', {
      address: syncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, WETH, UNISWAP_V2_FACTORY, UNISWAP_V2_ROUTER],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['UniswapV2', 'Ethereum'];
export default deployFunction;
