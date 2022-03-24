import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { shouldVerifyContract } from '@utils/deploy';
import { SOLIDLY_ROUTER_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const asyncDeploy = await hre.deployments.deploy('AsyncSolidly', {
    contract: 'solidity/contracts/swappers/async/SolidlySwapper.sol:SolidlySwapper',
    from: deployer,
    args: [governor, tradeFactory.address, SOLIDLY_ROUTER_REGISTRY.get(250)],
    log: true,
  });

  if (await shouldVerifyContract(asyncDeploy)) {
    await hre.run('verify:verify', {
      address: asyncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, SOLIDLY_ROUTER_REGISTRY.get(250)],
    });
  }

  //   const syncDeploy = await hre.deployments.deploy('SyncSolidly', {
  //     contract: 'solidity/contracts/swappers/sync/UniswapV2AnchorSwapper.sol:UniswapV2AnchorSwapper',
  //     from: deployer,
  //     args: [governor, tradeFactory.address, WETH, WFTM, SPIRITSWAP_FACTORY, SPIRITSWAP_ROUTER],
  //     log: true,
  //   });

  //   if (await shouldVerifyContract(syncDeploy)) {
  //     await hre.run('verify:verify', {
  //       address: syncDeploy.address,
  //       constructorArguments: [governor, tradeFactory.address, WETH, WFTM, SPIRITSWAP_FACTORY, SPIRITSWAP_ROUTER],
  //     });
  //   }
};

deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Solidly', 'Fantom'];
export default deployFunction;
