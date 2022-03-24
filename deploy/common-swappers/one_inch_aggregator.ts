import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getChainId, shouldVerifyContract } from '@utils/deploy';
import { ONE_INCH_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const chainId = await getChainId(hre);

  const deploy = await hre.deployments.deploy('OneInchAggregator', {
    contract: 'solidity/contracts/swappers/async/OneInchAggregatorSwapper.sol:OneInchAggregatorSwapper',
    from: deployer,
    args: [governor, tradeFactory.address, ONE_INCH_REGISTRY.get(chainId)],
    log: true,
  });

  if (await shouldVerifyContract(deploy)) {
    await hre.run('verify:verify', {
      address: deploy.address,
      constructorArguments: [governor, tradeFactory.address, ONE_INCH_REGISTRY.get(chainId)],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Ethereum', 'Polygon', 'OneInchAggregator'];
export default deployFunction;
