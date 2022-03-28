type AddressPerChain = Map<number, string>;

export const WETH_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
  // Polygon
  [137, '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'],
  // Fantom
  [250, '0x74b23882a30290451A17c44f4F05243b6b58C76d'],
]);

export const WFTM_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'],
]);

export const ONE_INCH_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0x11111112542D85B3EF69AE05771c2dCCff4fAa26'],
  // Polygon
  [137, '0x11111112542D85B3EF69AE05771c2dCCff4fAa26'],
]);

export const SUSHISWAP_FACTORY_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'],
  // Polygon
  [137, '0xc35DADB65012eC5796536bD9864eD8773aBc74C4'],
]);

export const SUSHISWAP_ROUTER_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'],
  // Polygon
  [137, '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'],
]);

export const ZRX_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0xdef1c0ded9bec7f1a1670819833240f027b25eff'],
  // Polygon
  [137, '0xdef1c0ded9bec7f1a1670819833240f027b25eff'],
  // Fantom
  [250, '0xdef189deaef76e379df891899eb5a00a94cbc250'],
]);

export const UNISWAP_V2_FACTORY_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'],
]);

export const UNISWAP_V2_ROUTER_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'],
]);

export const BANCOR_CONTRACT_REGISTRY: AddressPerChain = new Map([
  // Mainnet
  [1, '0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4'],
]);

export const SOLIDLY_FACTORY_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0x3faab499b519fdc5819e3d7ed0c26111904cbc28'],
]);

export const SOLIDLY_ROUTER_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0xa38cd27185a464914D3046f0AB9d43356B34829D'],
]);

export const SPIRITSWAP_FACTORY_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0xef45d134b73241eda7703fa787148d9c9f4950b0'],
]);

export const SPIRITSWAP_ROUTER_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0x16327e3fbdaca3bcf7e38f5af2599d2ddc33ae52'],
]);

export const SPOOKYSWAP_FACTORY_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3'],
]);

export const SPOOKYSWAP_ROUTER_REGISTRY: AddressPerChain = new Map([
  // Fantom
  [250, '0xF491e7B69E4244ad4002BC14e878a34207E38c29'],
]);
