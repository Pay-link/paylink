// @ts-nocheck
import { createWalletClient, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// 1. Read the compiled ABI and Bytecode
const abiPath = path.join(__dirname, '../src/contracts/build/src_contracts_ZaPayEscrow_sol_ZaPayEscrow.abi')
const binPath = path.join(__dirname, '../src/contracts/build/src_contracts_ZaPayEscrow_sol_ZaPayEscrow.bin')

if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
  console.error('Compiled contract not found! Run npx solc first.')
  process.exit(1)
}

const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'))
const bytecode = ('0x' + fs.readFileSync(binPath, 'utf8').trim()) as `0x${string}`

// 2. Setup the deployer wallet using viem
const privateKey = process.env.ADMIN_PRIVATE_KEY
if (!privateKey) {
  console.error('Missing ADMIN_PRIVATE_KEY in .env.local')
  process.exit(1)
}

const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'
const usdcAddress = '0x3600000000000000000000000000000000000000' // Arc Testnet USDC address

const account = privateKeyToAccount(privateKey as `0x${string}`)
const client = createWalletClient({
  account,
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    network: 'arc-testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } }
  } as any,
  transport: http(rpcUrl)
}).extend(publicActions)

async function main() {
  console.log(`Deploying ZaPayEscrow to Arc Testnet...`)
  console.log(`Deployer address: ${account.address}`)
  
  try {
    const hash = await client.deployContract({
      abi,
      bytecode,
      args: [usdcAddress],
    })
    console.log(`Transaction sent! Tx Hash: ${hash}`)
    
    console.log(`Waiting for confirmation...`)
    const receipt = await client.waitForTransactionReceipt({ hash })
    
    console.log(`\n✅ Contract successfully deployed!`)
    console.log(`🚀 Contract Address: ${receipt.contractAddress}`)
    console.log(`\nPlease add this to your .env.local:`)
    console.log(`NEXT_PUBLIC_ESCROW_ADDRESS=${receipt.contractAddress}`)
  } catch (err) {
    console.error('Deployment failed:', err)
  }
}

main()
