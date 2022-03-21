import { ERC20ForTest, ERC20ForTest__factory } from '@typechained';
import { BigNumber, utils, constants } from 'ethers';
import { ethers } from 'hardhat';

export const deploy = async ({
  name,
  symbol,
  decimals,
  initialAccount,
  initialAmount,
}: {
  name: string;
  symbol: string;
  decimals?: BigNumber | number;
  initialAccount?: string;
  initialAmount?: BigNumber | number;
}): Promise<ERC20ForTest> => {
  const erc20Factory = (await ethers.getContractFactory('solidity/contracts/for-test/ERC20.sol:ERC20ForTest')) as ERC20ForTest__factory;
  const erc20 = await erc20Factory.deploy(
    name,
    symbol,
    decimals || '18',
    initialAccount ?? constants.AddressZero,
    BigNumber.isBigNumber(initialAmount) ? initialAmount : utils.parseUnits(`${initialAmount ?? 0}`, decimals || 18)
  );
  return erc20;
};
