---
title: Seismic Signal API
emoji: 🌊
colorFrom: gray
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# Seismic Signal API

Docker Space backend for Seismic Signal.

This service runs the Express API used by the Seismic Signal frontend.

Required secrets and variables in the Hugging Face Space settings:

- `DATABASE_URL`
- `SESSION_SECRET`
- `FRONTEND_URL`
- `ADMIN_WALLET_ADDRESS`
- `SEISMIC_RPC_URL`
- `SEISMIC_EXPLORER_URL`
- `SEISMIC_EXPLORER_API`
- `VERIFIED_TOKENS`
- `HUGGINGFACE_API_KEY`
- `HUGGINGFACE_MODEL`
- `ARSEI_TOKEN_ADDRESS`
- `SEISMIC_WETH_ADDRESS`

Notes:

- This Space is intended to be used with an external Postgres database such as Neon.
- Session cookies depend on the frontend origin being set correctly in `FRONTEND_URL`.
- The backend listens on port `7860`, which matches Hugging Face Docker Spaces expectations.

Build by arlor
