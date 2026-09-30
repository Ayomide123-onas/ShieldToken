const supportedNetworks = [
  {
    chainId: 1,
    chainHex: "0x1",
    name: "Ethereum Mainnet",
    rpcUrls: ["https://ethereum-rpc.publicnode.com"],
    blockExplorerUrls: ["https://etherscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    chainId: 8453,
    chainHex: "0x2105",
    name: "Base",
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    chainId: 137,
    chainHex: "0x89",
    name: "Polygon PoS",
    rpcUrls: ["https://polygon-bor-rpc.publicnode.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  },
  {
    chainId: 42161,
    chainHex: "0xa4b1",
    name: "Arbitrum One",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    chainId: 10,
    chainHex: "0xa",
    name: "Optimism",
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    chainId: 56,
    chainHex: "0x38",
    name: "BNB Smart Chain",
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com"],
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  },
  {
    chainId: 43114,
    chainHex: "0xa86a",
    name: "Avalanche C-Chain",
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  },
  {
    chainId: 11155111,
    chainHex: "0xaa36a7",
    name: "Sepolia",
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  },
  {
    chainId: 31337,
    chainHex: "0x7a69",
    name: "Anvil Local",
    rpcUrls: ["http://127.0.0.1:8545"],
    blockExplorerUrls: [],
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
];

const elements = {
  account: document.querySelector("#account-value"),
  accountMeta: document.querySelector("#account-meta"),
  balanceValue: document.querySelector("#balance-value"),
  balanceMeta: document.querySelector("#balance-meta"),
  chainName: document.querySelector("#chain-name"),
  chainId: document.querySelector("#chain-id"),
  connectionPill: document.querySelector("#connection-pill"),
  connectionLabel: document.querySelector("#connection-label"),
  connectButton: document.querySelector("#connect-button"),
  disconnectButton: document.querySelector("#disconnect-button"),
  refreshBalanceButton: document.querySelector("#refresh-balance-button"),
  notice: document.querySelector("#notice"),
  noticeMessage: document.querySelector("#notice-message"),
  noticeTitle: document.querySelector("#notice-title"),
  sessionMeta: document.querySelector("#session-meta"),
  sessionState: document.querySelector("#session-state"),
  stateDot: document.querySelector("#state-dot"),
  switchButton: document.querySelector("#switch-button"),
  switchPanel: document.querySelector("#switch-panel"),
  networkSelect: document.querySelector("#network-select"),
  supportedNetworks: document.querySelector("#supported-networks"),
};

let provider;
let account = null;
let chainId = null;
let errorMessage = "";
let busy = false;
let balanceLoading = false;
let balanceValue = null;
let balanceError = "";
let balanceRequestId = 0;

function networkFor(id) {
  return supportedNetworks.find((network) => network.chainId === id);
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUnits(value, decimals, precision = 6) {
  const amount = BigInt(value);
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionDigits = Math.min(decimals, precision);
  const fractionDivisor = 10n ** BigInt(decimals - fractionDigits);
  const formattedFraction = (fraction / fractionDivisor).toString().padStart(fractionDigits, "0").replace(/0+$/, "");
  const groupedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return formattedFraction ? `${groupedWhole}.${formattedFraction}` : groupedWhole;
}

function populateNetworkOptions() {
  for (const network of supportedNetworks) {
    const option = document.createElement("option");
    option.value = String(network.chainId);
    option.textContent = network.name;
    elements.networkSelect.append(option);
  }
  for (const network of supportedNetworks) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const id = document.createElement("span");
    name.textContent = network.name;
    id.textContent = network.chainId;
    item.append(name, id);
    elements.supportedNetworks.append(item);
  }
}

function render() {
  const connected = Boolean(account && provider);
  const network = chainId === null ? null : networkFor(chainId);
  const unsupported = connected && !network;

  elements.account.textContent = connected ? shortAddress(account) : "Not connected";
  elements.accountMeta.textContent = connected ? account : "Connect a wallet to view its address";
  elements.chainName.textContent = connected ? (network?.name ?? "Unsupported network") : "Not connected";
  elements.chainId.textContent = connected && chainId !== null ? `CHAIN ID / ${chainId}` : "CHAIN ID / --";
  elements.sessionState.textContent = !connected ? "Awaiting wallet" : unsupported ? "Action required" : "Connected";
  elements.sessionMeta.textContent = !connected
    ? "No wallet session is active"
    : unsupported
      ? "Switch to a supported network to continue"
      : "Account and network are monitored live";

  elements.balanceValue.textContent = !connected
    ? "--"
    : balanceLoading
      ? "Fetching balance..."
      : balanceValue === null
        ? "Unavailable"
        : `${balanceValue} ${network?.nativeCurrency.symbol ?? "native"}`;
  elements.balanceMeta.textContent = !connected
    ? "Connect a wallet to fetch its balance"
    : balanceError
      ? balanceError
      : balanceLoading
        ? "Reading the latest wallet balance"
        : balanceValue === null
          ? "Refresh to try again"
          : "Native coin balance on the active chain";

  elements.connectionPill.classList.toggle("is-connected", connected && !unsupported);
  elements.connectionPill.classList.toggle("is-unsupported", unsupported);
  elements.connectionLabel.textContent = unsupported ? "Unsupported network" : connected ? "Wallet connected" : "Not connected";
  elements.stateDot.classList.toggle("is-connected", connected && !unsupported);
  elements.stateDot.classList.toggle("is-unsupported", unsupported);
  elements.connectButton.hidden = connected;
  elements.disconnectButton.hidden = !connected;
  elements.connectButton.disabled = busy;
  elements.disconnectButton.disabled = busy;
  elements.refreshBalanceButton.disabled = busy || balanceLoading || !connected;
  elements.refreshBalanceButton.setAttribute("aria-busy", String(balanceLoading));
  elements.switchButton.disabled = busy;
  elements.switchPanel.hidden = !unsupported;

  elements.notice.hidden = !errorMessage && !unsupported;
  if (errorMessage) {
    elements.noticeTitle.textContent = unsupported ? "Unsupported network" : "Wallet connection issue";
    elements.noticeMessage.textContent = errorMessage;
  } else if (unsupported) {
    elements.noticeTitle.textContent = "Unsupported network detected";
    const supportedNames = supportedNetworks.map((network) => network.name).join(", ");
    elements.noticeMessage.textContent = `Chain ${chainId} is not supported. Switch to one of these networks below: ${supportedNames}.`;
  }
}

function showError(error) {
  errorMessage = error?.message || "The wallet request could not be completed.";
  render();
}

function clearError() {
  errorMessage = "";
}

async function refreshWallet() {
  if (!provider || !account) return;
  const requestId = ++balanceRequestId;
  const requestProvider = provider;
  const requestAccount = account;
  const requestChainId = chainId;
  balanceLoading = true;
  balanceError = "";
  render();
  try {
    const rawBalance = await requestProvider.request({
      method: "eth_getBalance",
      params: [requestAccount, "latest"],
    });
    if (requestId !== balanceRequestId || requestProvider !== provider || requestAccount !== account || requestChainId !== chainId) return;
    const network = networkFor(requestChainId);
    balanceValue = formatUnits(rawBalance, network?.nativeCurrency.decimals ?? 18);
  } catch (error) {
    if (requestId === balanceRequestId) {
      balanceValue = null;
      balanceError = error?.message || "Could not fetch balance";
    }
  } finally {
    if (requestId === balanceRequestId) {
      balanceLoading = false;
      render();
    }
  }
}

async function refreshBalance() {
  if (!provider) return;
  busy = true;
  clearError();
  render();
  try {
    const [accounts, chainHex] = await Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }),
    ]);
    account = accounts[0] ?? null;
    chainId = Number.parseInt(chainHex, 16);
    if (!account) {
      balanceRequestId++;
      balanceValue = null;
      balanceError = "No account is currently selected in the wallet";
      balanceLoading = false;
      return;
    }
    await refreshWallet();
  } catch (error) {
    balanceError = error?.message || "Could not refresh wallet balance";
  } finally {
    busy = false;
    render();
  }
}

function detachProvider() {
  if (!provider?.removeListener) return;
  provider.removeListener("accountsChanged", handleAccountsChanged);
  provider.removeListener("chainChanged", handleChainChanged);
  provider.removeListener("disconnect", handleProviderDisconnect);
}

function handleAccountsChanged(accounts) {
  account = accounts[0] ?? null;
  balanceRequestId++;
  balanceValue = null;
  balanceError = "";
  balanceLoading = false;
  clearError();
  render();
  if (account) refreshWallet();
}

function handleChainChanged(chainHex) {
  chainId = Number.parseInt(chainHex, 16);
  balanceRequestId++;
  balanceValue = null;
  balanceError = "";
  balanceLoading = false;
  clearError();
  render();
  if (account) refreshWallet();
}

function handleProviderDisconnect() {
  detachProvider();
  provider = null;
  account = null;
  chainId = null;
  balanceRequestId++;
  balanceValue = null;
  balanceError = "";
  balanceLoading = false;
  clearError();
  render();
}

function attachProvider(walletProvider) {
  detachProvider();
  provider = walletProvider;
  provider.on?.("accountsChanged", handleAccountsChanged);
  provider.on?.("chainChanged", handleChainChanged);
  provider.on?.("disconnect", handleProviderDisconnect);
}

async function connectWallet() {
  if (!window.ethereum) {
    showError({ message: "No injected wallet was found. Install a browser wallet and try again." });
    return;
  }

  busy = true;
  clearError();
  render();
  try {
    const walletProvider = window.ethereum;
    const accounts = await walletProvider.request({ method: "eth_requestAccounts" });
    attachProvider(walletProvider);
    account = accounts[0] ?? null;
    chainId = Number.parseInt(await provider.request({ method: "eth_chainId" }), 16);
    if (account) await refreshWallet();
    render();
  } catch (error) {
    showError(error);
  } finally {
    busy = false;
    render();
  }
}

function disconnectWallet() {
  detachProvider();
  provider = null;
  account = null;
  chainId = null;
  balanceRequestId++;
  balanceValue = null;
  balanceError = "";
  balanceLoading = false;
  clearError();
  render();
}

async function switchNetwork() {
  if (!provider) return;
  const network = supportedNetworks.find((item) => item.chainId === Number(elements.networkSelect.value));
  if (!network) return;

  busy = true;
  clearError();
  render();
  try {
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: network.chainHex }] });
    } catch (error) {
      if (error.code !== 4902) throw error;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: network.chainHex,
          chainName: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: network.rpcUrls,
          blockExplorerUrls: network.blockExplorerUrls,
        }],
      });
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: network.chainHex }] });
    }
    chainId = network.chainId;
    clearError();
  } catch (error) {
    showError(error);
  } finally {
    busy = false;
    render();
  }
}

elements.connectButton.addEventListener("click", connectWallet);
elements.disconnectButton.addEventListener("click", disconnectWallet);
elements.refreshBalanceButton.addEventListener("click", refreshBalance);
elements.switchButton.addEventListener("click", switchNetwork);
populateNetworkOptions();
render();