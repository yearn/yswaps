import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getChainId, shouldVerifyContract } from '@utils/deploy';
import { ZRX_REGISTRY } from '@deploy/addresses-registry';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, governor } = await hre.getNamedAccounts();

  const tradeFactory = await hre.deployments.get('TradeFactory');

  const chainId = await getChainId(hre);

  const deploy = await hre.deployments.deploy('ZRX', {
    contract: 'solidity/contracts/swappers/async/ZRXSwapper.sol:ZRXSwapper',
    from: deployer,
    args: [governor, tradeFactory.address, ZRX_REGISTRY.get(chainId)],
    log: true,
  });

  if (await shouldVerifyContract(deploy)) {
    await hre.run('verify:verify', {
      address: deploy.address,
      constructorArguments: [governor, tradeFactory.address, ZRX_REGISTRY.get(chainId)],
    });
  }
};
deployFunction.dependencies = ['TradeFactory'];
deployFunction.tags = ['Ethereum', 'Fantom', 'Polygon', 'ZRX'];
export default deployFunction;
