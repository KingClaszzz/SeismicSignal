# Seismic Signal

Seismic Signal is a Seismic-native ecosystem discovery and interaction layer for testnet.

The app is designed to help:

- users discover and launch Seismic projects faster
- builders submit projects and gain visibility
- the community add lightweight voting signal
- users inspect wallet context and prepare non-custodial actions

## Core Features

- **Discovery Directory**: Browse projects building on Seismic testnet
- **Signal Review**: Submit and vote on projects with a simple wallet-based model
- **My Seismic**: Wallet profile with balances, activity, and ecosystem context
- **Signal Agent**: Seismic-focused AI assistant for ecosystem Q&A and wallet guidance
- **Non-Custodial Actions**: Transfer and swap flows are designed around explicit wallet approval

## Seismic Alignment

- Chain ID: `5124`
- RPC: `https://gcp-1.seismictest.net/rpc`
- Explorer: `https://seismic-testnet.socialscan.io`
- Native asset: `ETH`
- Ecosystem bootstrap token in this repo: `ARSEI`

`ARSEI` is an app-level ecosystem token in this repository and should not be presented as an official Seismic network token unless you explicitly decide that and communicate it publicly.

## Getting Started

### Backend

1. `cd backend`
2. `npm install`
3. Configure `.env`
   - `DATABASE_URL`: PostgreSQL connection string
   - `JATEVO_API_KEY`: API key for the AI engine
   - `SESSION_SECRET`: secure session secret
   - `SEISMIC_RPC_URL`: optional override for Seismic RPC
   - `SEISMIC_EXPLORER_URL`: optional explorer base URL
   - `SEISMIC_EXPLORER_API`: optional explorer API override
   - `VERIFIED_TOKENS`: comma-separated list, example `ETH,ARSEI,SUSD,WETH`
4. `npx prisma db push`
5. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. Configure `.env`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
   - `NEXT_PUBLIC_SEISMIC_RPC_URL`
   - `NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS`
   - `NEXT_PUBLIC_SUSD_TOKEN_ADDRESS`
4. `npm run dev`

### Contracts

Contracts live in [contracts](/C:/Users/aryan/seismic-explorer/contracts) and include:

- project registry
- project voting
- token registry
- intent registry
- wrapped native ETH
- ARSEI token
- factory / pair / router

The current bootstrap swap flow is:

- native `ETH -> ARSEI`
- `ARSEI -> ETH`
- optional `ARSEI / sUSD` token-to-token routing

## Project Management

Use the built-in backend CLI for project maintenance:

```bash
cd backend
npm run manage list
npm run manage add
npm run manage approve <id>
npm run manage delete <id>
npm run manage delete-all
```

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Framer Motion
- **Web3**: wagmi, viem, WalletConnect, SIWE
- **Backend**: Express.js, Prisma ORM, PostgreSQL
- **Contracts**: Solidity scaffold prepared for Seismic-aligned explorer, governance, and swap flows
- **AI**: Signal Agent via Jatevo-compatible chat completion API

## Current Status

The frontend has been rebranded to Seismic Signal and updated to Seismic testnet assumptions.

The backend has been moved off Arc-specific network assumptions, but explorer integrations may still require final tuning depending on the exact API behavior of your chosen Seismic explorer endpoint.

The contracts include:

- `ARSEI`
- wrapped ETH
- project registry
- project voting
- token registry
- intent registry
- AMM router stack

Build by Arlor09
