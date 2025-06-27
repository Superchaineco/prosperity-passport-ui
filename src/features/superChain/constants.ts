import SuperChainSetupABI from './abi/SuperChainSetup.json'
import SuperChainModuleABI from './abi/SuperChainModule.json'
import type { Address } from 'viem'
import CometABI from '../vaults/abi/comet.json'
import AaveABI from '../vaults/abi/aave.json'
import AirdropABI from './abi/Airdrop.json'

enum ENVIRONMENTS {
  development = 'development',
  production = 'production',
}

const ENV = (process.env.NEXT_PUBLIC_APP_ENV as ENVIRONMENTS) || ENVIRONMENTS.development
const environmentConfig = {
  development: {
    SUPER_CHAIN_SETUP_ADDRESS: '0xe0651391D3fEF63F14FB33C9cf4F157F3eD0F4AF',
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS: '0x58f5805b5072C3Dd157805132714E1dF40E79c66',
    SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS: '0xED12D87487B372cf4447C8147a89aA01C133Dc52',
    ERC4337_MODULE_ADDRESS: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
    JSON_RPC_PROVIDER: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER,
    JSON_RPC_PROVIDER_OP: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER_OP,
    SUBGRAPH_URL: 'https://api.studio.thegraph.com/query/72352/prosperity-passport/version/latest',
    CHAIN_ID: '42220',
    AIRDROP_ADDRESS: '0xcc86F7903f52EEb20c512D26C829e1545D577c47',
  },
  production: {
    SUPER_CHAIN_SETUP_ADDRESS: '0xe0651391D3fEF63F14FB33C9cf4F157F3eD0F4AF',
    SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS: '0x58f5805b5072C3Dd157805132714E1dF40E79c66',
    SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS: '0xED12D87487B372cf4447C8147a89aA01C133Dc52',
    ERC4337_MODULE_ADDRESS: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
    JSON_RPC_PROVIDER: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER,
    JSON_RPC_PROVIDER_OP: process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER_OP,
    SUBGRAPH_URL:
      'https://gateway.thegraph.com/api/e2382481a319ad3d1d0d65473d606d24/subgraphs/id/3dQGijWxqpFfXUenK9TjLc9wijNeDDSjGtw3ztWMQb2n',
    CHAIN_ID: '42220',
    AIRDROP_ADDRESS: '0xcc86F7903f52EEb20c512D26C829e1545D577c47',
  },
}[ENV]

export const COMPOUND_ABI = CometABI
export const AAVE_ABI = AaveABI
export const AIRDROP_ABI = AirdropABI
export const SUPER_CHAIN_SETUP_ABI = SuperChainSetupABI
export const SUPER_CHAIN_MODULE_ABI = SuperChainModuleABI
export const SUPER_CHAIN_SETUP_ADDRESS = environmentConfig.SUPER_CHAIN_SETUP_ADDRESS as Address
export const SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS = environmentConfig.SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS as Address
export const SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS = environmentConfig.SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS as Address
export const ERC4337_MODULE_ADDRESS = environmentConfig.ERC4337_MODULE_ADDRESS as Address
export const JSON_RPC_PROVIDER = environmentConfig.JSON_RPC_PROVIDER
export const JSON_RPC_PROVIDER_OP = environmentConfig.JSON_RPC_PROVIDER_OP
export const CHAIN_ID = environmentConfig.CHAIN_ID
export const SUBGRAPH_URL = environmentConfig.SUBGRAPH_URL

// export const SUNNY_TOKEN_ADDRESS = environmentConfig.SUNNY_TOKEN_ADDRESS as Address
export const AIRDROP_ADDRESS = environmentConfig.AIRDROP_ADDRESS as Address
