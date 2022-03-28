import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { shouldVerifyContract } from '@utils/deploy';
import { SPOOKYSWAP_FACTORY_REGISTRY, SPOOKYSWAP_ROUTER_REGISTRY, WETH_REGISTRY, WFTM_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const SPOOKYSWAP_FACTORY = SPOOKYSWAP_FACTORY_REGISTRY.get(250);
  const SPOOKYSWAP_ROUTER = SPOOKYSWAP_ROUTER_REGISTRY.get(250);
  const WETH = WETH_REGISTRY.get(250);
  const WFTM = WFTM_REGISTRY.get(250);

  const asyncDeploy = await hre.deployments.deploy('AsyncSpookyswap', {
    contract: 'solidity/contracts/swappers/async/UniswapV2Swapper.sol:UniswapV2Swapper',
    from: deployer,
    args: [governor, tradeFactory.address, SPOOKYSWAP_FACTORY, SPOOKYSWAP_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(asyncDeploy)) {
    await hre.run('verify:verify', {
      address: asyncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, SPOOKYSWAP_FACTORY, SPOOKYSWAP_ROUTER],
    });
  }

  const syncDeploy = await hre.deployments.deploy('SyncSpookyswap', {
    contract: 'solidity/contracts/swappers/sync/UniswapV2AnchorSwapper.sol:UniswapV2AnchorSwapper',
    from: deployer,
    args: [governor, tradeFactory.address, WETH, WFTM, SPOOKYSWAP_FACTORY, SPOOKYSWAP_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(syncDeploy)) {
    await hre.run('verify:verify', {
      address: syncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, WETH, WFTM, SPOOKYSWAP_FACTORY, SPOOKYSWAP_ROUTER],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Spookyswap', 'Fantom'];
export default deployFunction;
