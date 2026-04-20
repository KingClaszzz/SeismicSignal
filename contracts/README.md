# Seismic Contracts

Initial Seismic-native contract scaffold for the explorer app.

Included contracts:

- `SeismicProjectRegistry`
- `SeismicProjectVoting`
- `SeismicTokenRegistry`
- `SeismicIntentRegistry`
- `ArseiToken` (`ARSEI` / Arlor Seismic)
- `SeismicWrappedETH` (`WETH`)
- `MockERC20`
- `SeismicFactory`
- `SeismicPair`
- `SeismicRouter`

These contracts are intentionally simple first:

- native asset assumptions are removed from Arc-era logic
- governance is `1 wallet = 1 vote`
- token visibility is controlled through a verified token registry
- scheduled actions are recorded as intents, not auto-executed
- `ARSEI` is the primary ecosystem bootstrap token for the current scaffold
- native `ETH -> ARSEI` flow is supported through `WETH / ARSEI` liquidity

Suggested next steps:

1. install Seismic tooling from the official docs
2. add tests for registry, vote changes, intent lifecycle, and AMM math
3. add deployment scripts for Seismic testnet
4. later add `SRC20` contracts and signed-read privacy flows
