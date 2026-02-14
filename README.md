direccion etherscan 
https://sepolia.etherscan.io/address/0xBE952fcEa828567463e901BFfE8790acd38B3882#code

# 🚀 NEXFUND

**NEXFUND** is a decentralized crowdfunding platform built with **Scaffold-ETH 2**. It allows users to create campaigns, donate ETH, and receive on-chain NFT medals based on their contribution tier.

## 🌟 Key Features

### 🏗️ For Creators (Admin)
- **Launch Projects**: Create new crowdfunding campaigns with a funding goal (ETH) and deadline.
- **Audit Withdrawals**: Withdraw funds transparently by specifying a reason, which is recorded on-chain for donors to see.

### 🎁 For Donors
- **Transparent Donations**: Contribute ETH directly to smart contracts.
- **Reward Tiers**: Unlock status levels based on contribution amount:
  - 🥉 **Bronze**: 0.001 ETH
  - 🥈 **Silver**: 0.01 ETH
  - 🥇 **Gold**: 0.1 ETH
- **Refunds**: Automatically claim refunds if a project fails to meet its goal by the deadline.

### 👤 Profile & NFTs
- **On-Chain NFTs**: Claim a generated NFT medal representing your highest tier (Standard, Bronze, Silver, Gold).
- **SVG Generation**: Medals are actively generated on-chain (Brutalist Design).

## 🛠️ Tech Stack using Scaffold-ETH 2

- **Blockchain**: Ethereum (Sepolia / Localhost)
- **Smart Contract**: Solidity (Hardhat)
- **Frontend**: Next.js, RainbowKit, Wagmi, Tailwind CSS
- **Design**: Brutalist aesthetic with custom CSS.

## 🚀 Quickstart

### 1. Requirements
- [Node (>= v18)](https://nodejs.org/en/download/)
- Yarn (`npm install -g yarn`)
- Git

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/josemanuel2703199922/Nexfund.git
cd Nexfund
yarn install
```

### 3. Environment Setup
Copy the sample env files and configure them:

```bash
# Hardhat (for deployment)
cp packages/hardhat/.env.example packages/hardhat/.env

# NextJS (for frontend)
cp packages/nextjs/.env.example packages/nextjs/.env.local
```
> **Tip:** for public deployment (e.g. Sepolia), run `yarn generate` in `packages/hardhat` to create a deployer account and `yarn account:import` to import an existing one.

### 4. Run Locally
Run the dApp continuously with the following commands in separate terminals:

**Terminal 1: Local Blockchain**
```bash
yarn chain
```

**Terminal 2: Deploy Contracts**
```bash
yarn deploy
```

**Terminal 3: Frontend**
```bash
yarn start
```
Visit http://localhost:3000 to interact with your dApp.

### 5. Deploy to Sepolia
To deploy to the Sepolia testnet:

1. Ensure your deployer account has Sepolia ETH.
2. Run:
   ```bash
   yarn deploy --network sepolia
   ```
3. Your frontend is already configured to connect to Sepolia (`scaffold.config.ts`).













