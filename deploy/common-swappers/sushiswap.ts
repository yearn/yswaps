import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getChainId, shouldVerifyContract } from '@utils/deploy';
import { SUSHISWAP_FACTORY_REGISTRY, SUSHISWAP_ROUTER_REGISTRY, WETH_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const chainId = await getChainId(hre);

  const WETH = WETH_REGISTRY.get(chainId);

  const SUSHISWAP_FACTORY = SUSHISWAP_FACTORY_REGISTRY.get(chainId);

  const SUSHISWAP_ROUTER = SUSHISWAP_ROUTER_REGISTRY.get(chainId);

  const asyncDeploy = await hre.deployments.deploy('AsyncSushiswap', {
    contract: 'solidity/contracts/swappers/async/UniswapV2Swapper.sol:UniswapV2Swapper',
    from: deployer,
    args: [governor, tradeFactory.address, SUSHISWAP_FACTORY, SUSHISWAP_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(asyncDeploy)) {
    await hre.run('verify:verify', {
      address: asyncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, SUSHISWAP_FACTORY, SUSHISWAP_ROUTER],
    });
  }

  const syncDeploy = await hre.deployments.deploy('SyncSushiswap', {
    contract: 'solidity/contracts/swappers/sync/UniswapV2Swapper.sol:UniswapV2Swapper',
    from: deployer,
    args: [governor, tradeFactory.address, WETH, SUSHISWAP_FACTORY, SUSHISWAP_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(syncDeploy)) {
    await hre.run('verify:verify', {
      address: syncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, WETH, SUSHISWAP_FACTORY, SUSHISWAP_ROUTER],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Sushiswap', 'Polygon', 'Ethereum'];
export default deployFunction;
