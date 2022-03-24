import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { shouldVerifyContract } from '@utils/deploy';
import { ethers } from 'ethers';
import { BANCOR_CONTRACT_REGISTRY } from '@deploy/addresses-registry';

export const BANCOR_NETWORK_NAME = ethers.utils.formatBytes32String('BancorNetwork');

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const BANCOR_REGISTRY = BANCOR_CONTRACT_REGISTRY.get(1);

  const asyncDeploy = await hre.deployments.deploy('AsyncBancor', {
    contract: 'solidity/contracts/swappers/async/BancorSwapper.sol:BancorSwapper',
    from: deployer,
    args: [governor, tradeFactory.address, BANCOR_REGISTRY, BANCOR_NETWORK_NAME],
    log: true,
  });

  if (await shouldVerifyContract(asyncDeploy)) {
    await hre.run('verify:verify', {
      address: asyncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, BANCOR_REGISTRY, BANCOR_NETWORK_NAME],
    });
  }

  const syncDeploy = await hre.deployments.deploy('SyncBancor', {
    contract: 'solidity/contracts/swappers/sync/BancorSwapper.sol:BancorSwapper',
    from: deployer,
    args: [governor, tradeFactory.address, BANCOR_REGISTRY, BANCOR_NETWORK_NAME],
    log: true,
  });

  if (await shouldVerifyContract(syncDeploy)) {
    await hre.run('verify:verify', {
      address: syncDeploy.address,
      constructorArguments: [governor, tradeFactory.address, BANCOR_REGISTRY, BANCOR_NETWORK_NAME],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Bancor', 'Ethereum'];
export default deployFunction;
