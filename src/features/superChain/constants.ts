import SuperChainSetupABI from './abi/SuperChainSetup.json'
import SuperChainModuleABI from './abi/SuperChainModule.json'
import type { Address } from 'viem'

enum ENVIRONMENTS {
  development = 'development',
  production = 'production',
}

const ENV = (process.env.NEXT_PUBLIC_APP_ENV as ENVIRONMENTS) || ENVIRONMENTS.development
const environmentConfig = {
  development: {
    SUPER_CHAIN_SETUP_ADDRESS: '0xd2B51c08de198651653523ED14A137Df3aE86Ee0',
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS: '0x1Ee397850c3CA629d965453B3cF102E9A8806Ded',
    SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS: '0xaaA5200c5E4C01b3Ea89F175F9cf17438C193abA',
    ERC4337_MODULE_ADDRESS: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
    JSON_RPC_PROVIDER: 'https://rpc.ankr.com/optimism',
    SUBGRAPH_URL: 'https://api.studio.thegraph.com/query/72352/super-accounts/version/latest',
    CHAIN_ID: '10',
  },
  production: {
    SUPER_CHAIN_SETUP_ADDRESS: '0xe0651391D3fEF63F14FB33C9cf4F157F3eD0F4AF',
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS: '0x58f5805b5072C3Dd157805132714E1dF40E79c66',
    SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS: '0xED12D87487B372cf4447C8147a89aA01C133Dc52',
    ERC4337_MODULE_ADDRESS: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
    JSON_RPC_PROVIDER: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER,
    SUBGRAPH_URL: 'https://api.studio.thegraph.com/query/72352/prosperity-passport/version/latest',
    CHAIN_ID: '42220',
  },
}[ENV]

export const SUPER_CHAIN_SETUP_ABI = SuperChainSetupABI
export const SUPER_CHAIN_MODULE_ABI = SuperChainModuleABI
export const SUPER_CHAIN_SETUP_ADDRESS = environmentConfig.SUPER_CHAIN_SETUP_ADDRESS as Address
export const SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS = environmentConfig.SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS as Address
export const SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS = environmentConfig.SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS as Address
export const ERC4337_MODULE_ADDRESS = environmentConfig.ERC4337_MODULE_ADDRESS as Address
export const JSON_RPC_PROVIDER = environmentConfig.JSON_RPC_PROVIDER
export const CHAIN_ID = environmentConfig.CHAIN_ID
export const SUBGRAPH_URL = environmentConfig.SUBGRAPH_URL
