## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

# ShieldToken

## Wallet UI

Serve the `web/` directory on localhost (for example, `python -m http.server 4173 --directory web`) and open `http://localhost:4173/` in a browser with an injected Ethereum wallet installed. The wallet panel displays the active account, chain ID, and native-coin balance; it refreshes balances on demand and follows account/network changes. The supported-chain list includes Ethereum Mainnet, Base, Polygon PoS, Arbitrum One, Optimism, BNB Smart Chain, Avalanche C-Chain, Sepolia, and local Anvil. Unsupported chains display a warning and offer a switch action.

The Disconnect button clears the active wallet session in the page. Injected-wallet providers do not expose a universal dapp-initiated disconnect method.
