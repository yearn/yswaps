import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { shouldVerifyContract } from '@utils/deploy';
import { SPIRITSWAP_FACTORY_REGISTRY, SPIRITSWAP_ROUTER_REGISTRY, WETH_REGISTRY, WFTM_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const SPIRITSWAP_FACTORY = SPIRITSWAP_FACTORY_REGISTRY.get(250);
  const SPIRITSWAP_ROUTER = SPIRITSWAP_ROUTER_REGISTRY.get(250);
  const WETH = WETH_REGISTRY.get(250);
  const WFTM = WFTM_REGISTRY.get(250);

  const asyncDeploy = await hre.deployments.deploy('AsyncSpiritswap', {
    contract: 'solidity/contracts/swappers/async/UniswapV2Swapper.sol:UniswapV2Swapper',
    from: deployer,
    args: [governor, tradeFactory.address, SPIRITSWAP_FACTORY, SPIRITSWAP_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(asyncDeploy)) {
    await hre.run('verify:verify', {
      address: asyncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, SPIRITSWAP_FACTORY, SPIRITSWAP_ROUTER],
    });
  }

  const syncDeploy = await hre.deployments.deploy('SyncSpiritswap', {
    contract: 'solidity/contracts/swappers/sync/UniswapV2AnchorSwapper.sol:UniswapV2AnchorSwapper',
    from: deployer,
    args: [governor, tradeFactory.address, WETH, WFTM, SPIRITSWAP_FACTORY, SPIRITSWAP_ROUTER],
    log: true,
  });

  if (await shouldVerifyContract(syncDeploy)) {
    await hre.run('verify:verify', {
      address: syncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, WETH, WFTM, SPIRITSWAP_FACTORY, SPIRITSWAP_ROUTER],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Spiritswap', 'Fantom'];
export default deployFunction;
