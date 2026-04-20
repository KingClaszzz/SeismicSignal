import { Router } from "express";
import axios from "axios";
import rateLimit from "express-rate-limit";
import { createPublicClient, defineChain, formatEther, http, isAddress } from "viem";
import { SEISMIC_SYSTEM_PROMPT } from "../constants/agent_templates";
import { projects } from "../data/projects";

const router = Router();

const EXPLORER_URL = process.env.SEISMIC_EXPLORER_URL || "https://seismic-testnet.socialscan.io";
const EXPLORER_API = process.env.SEISMIC_EXPLORER_API || "https://api.socialscan.io/seismic-testnet/v1/developer/api";
const SOCIALSCAN_API_KEY = process.env.SOCIALSCAN_API_KEY || "";
const SEISMIC_RPC_URL = process.env.SEISMIC_RPC_URL || "https://gcp-1.seismictest.net/rpc";
const VERIFIED_TOKENS = (process.env.VERIFIED_TOKENS || "")
  .split(",")
  .map((token) => token.trim().toUpperCase())
  .filter(Boolean);

const seismicTestnet = defineChain({
  id: 5124,
  name: "Seismic Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [SEISMIC_RPC_URL] },
  },
  testnet: true,
});

const publicClient = createPublicClient({
  chain: seismicTestnet,
  transport: http(SEISMIC_RPC_URL),
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: "Chat rate limit exceeded. Please wait a moment." },
});

const walletDataLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: "Wallet data rate limit exceeded. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitizeHistory(history: any[]) {
  return history.map((message: any) => ({
    role: message.role === "user" || message.role === "assistant" || message.role === "system" ? message.role : "user",
    content: typeof message.content === "string" ? message.content.substring(0, 1000) : "",
  }));
}

function buildLocalSignalReply(message: string, connectedAddress?: string) {
  const input = message.trim();
  const lower = input.toLowerCase();
  const hasWallet = !!connectedAddress;
  const isIndo = /\b(apa|bagaimana|buat|tolong|saya|kirim|swap|staking|dompet|wallet)\b/i.test(input);
  const say = (en: string, id: string) => (isIndo ? id : en);

  const ethTransferMatch = input.match(/(?:send|transfer|kirim)\s+([\d.]+)\s*(eth)\s+(?:to|ke)\s+(0x[a-fA-F0-9]{40})/i);
  if (ethTransferMatch) {
    const [, amount, token, to] = ethTransferMatch;
    return `${say(
      `I can prepare that transfer.\n\nWhat happens next:\n- Token: ETH\n- Amount: ${amount}\n- Recipient: ${to}\n- You will still confirm the transaction in your wallet.\n\n[[EXECUTE_TRANSFER:ETH:${amount}:${to}]]`,
      `Saya bisa siapkan transfer itu.\n\nYang akan dilakukan:\n- Token: ETH\n- Jumlah: ${amount}\n- Penerima: ${to}\n- Kamu tetap perlu konfirmasi transaksi di wallet.\n\n[[EXECUTE_TRANSFER:ETH:${amount}:${to}]]`
    )}`;
  }

  const arseiTransferMatch = input.match(/(?:send|transfer|kirim)\s+([\d.]+)\s*(arsei)\s+(?:to|ke)\s+(0x[a-fA-F0-9]{40})/i);
  if (arseiTransferMatch) {
    const [, amount, token, to] = arseiTransferMatch;
    return `${say(
      `I can prepare that transfer.\n\nWhat happens next:\n- Token: ARSEI\n- Amount: ${amount}\n- Recipient: ${to}\n- You will still confirm the transaction in your wallet.\n\n[[EXECUTE_TRANSFER:ARSEI:${amount}:${to}]]`,
      `Saya bisa siapkan transfer itu.\n\nYang akan dilakukan:\n- Token: ARSEI\n- Jumlah: ${amount}\n- Penerima: ${to}\n- Kamu tetap perlu konfirmasi transaksi di wallet.\n\n[[EXECUTE_TRANSFER:ARSEI:${amount}:${to}]]`
    )}`;
  }

  const swapMatch = input.match(/(?:swap|tukar)\s+([\d.]+)\s*eth\s+(?:to|ke|for)\s+arsei/i);
  if (swapMatch) {
    const [, amount] = swapMatch;
    return `${say(
      `I can prepare that swap.\n\nRoute:\n- From: ETH\n- To: ARSEI\n- Amount: ${amount}\n- Final execution still needs your wallet signature.\n\n[[EXECUTE_SWAP:ETH:ARSEI:${amount}]]`,
      `Saya bisa siapkan swap itu.\n\nRoute:\n- Dari: ETH\n- Ke: ARSEI\n- Jumlah: ${amount}\n- Eksekusi akhirnya tetap perlu tanda tangan wallet kamu.\n\n[[EXECUTE_SWAP:ETH:ARSEI:${amount}]]`
    )}`;
  }

  const stakeMatch = input.match(/(?:stake|staking)\s+([\d.]+)\s*arsei/i);
  if (stakeMatch) {
    const [, amount] = stakeMatch;
    return `${say(
      `I can prepare that staking action.\n\nStaking plan:\n- Token: ARSEI\n- Amount: ${amount}\n- If approval is needed, your wallet may ask for approval before staking.\n\n[[EXECUTE_STAKE:${amount}]]`,
      `Saya bisa siapkan staking itu.\n\nRencana staking:\n- Token: ARSEI\n- Jumlah: ${amount}\n- Jika approval diperlukan, wallet kamu mungkin akan minta approval dulu sebelum staking.\n\n[[EXECUTE_STAKE:${amount}]]`
    )}`;
  }

  if (lower.includes("what is seismic") || lower.includes("apa itu seismic") || lower.includes("what is seismic testnet") || lower.includes("apa itu seismic testnet")) {
    return say(
      `Seismic testnet is the public testing network for Seismic.\n\nKey facts:\n- Chain ID: 5124\n- Native asset: ETH\n- RPC: https://gcp-1.seismictest.net/rpc\n- Explorer: https://seismic-testnet.socialscan.io\n- Faucet: https://faucet.seismictest.net\n\nWhat makes Seismic different:\n- It is EVM-based\n- It is privacy-native\n- It supports patterns like shielded types, signed reads, and encrypted transaction flows`,
      `Seismic testnet adalah jaringan publik untuk testing di Seismic.\n\nInfo penting:\n- Chain ID: 5124\n- Native asset: ETH\n- RPC: https://gcp-1.seismictest.net/rpc\n- Explorer: https://seismic-testnet.socialscan.io\n- Faucet: https://faucet.seismictest.net\n\nYang membedakan Seismic:\n- Tetap EVM-based\n- Privacy-native\n- Mendukung shielded types, signed reads, dan encrypted transaction flows`
    );
  }

  if (lower.includes("what is seismic signal") || lower.includes("apa itu seismic signal")) {
    return say(
      `Seismic Signal is this dApp's ecosystem layer for Seismic testnet.\n\nWhat it does:\n- Helps users discover ecosystem projects\n- Ranks project signal through lightweight community voting\n- Adds utility rails like AI guidance, swap, and staking\n- Keeps wallet actions non-custodial`,
      `Seismic Signal adalah lapisan ekosistem untuk Seismic testnet di dApp ini.\n\nFungsinya:\n- Membantu user menemukan project ekosistem\n- Menampilkan sinyal project lewat voting komunitas ringan\n- Menambahkan utility seperti AI guidance, swap, dan staking\n- Tetap non-custodial untuk aksi wallet`
    );
  }

  if (lower.includes("private token") || lower.includes("src20") || lower.includes("shielded")) {
    return say(
      `On Seismic, SRC20 is the privacy-native token pattern.\n\nIn simple terms:\n- ERC20 keeps balances public\n- SRC20 shields balances and transfer amounts by default\n- It uses Seismic shielded types instead of normal public types\n\nIf you want, I can also explain the difference between ERC20 and SRC20 in practical app terms.`,
      `Di Seismic, SRC20 adalah pola token yang privacy-native.\n\nSederhananya:\n- ERC20 membuat balance publik\n- SRC20 menyembunyikan balance dan jumlah transfer secara default\n- Ia memakai shielded types dari Seismic, bukan tipe publik biasa\n\nKalau mau, saya juga bisa jelaskan perbedaan ERC20 dan SRC20 secara praktis buat app.`
    );
  }

  if (lower.includes("apps") || lower.includes("dapp") || lower.includes("project")) {
    return say(
      `I can help with that.\n\nInside Seismic Signal, I can:\n- summarize what a listed project does\n- point you to ecosystem links and context\n- help compare categories like DeFi, tools, bridges, and infra\n- guide you toward swap, staking, or wallet actions when relevant`,
      `Saya bisa bantu soal itu.\n\nDi dalam Seismic Signal, saya bisa:\n- merangkum fungsi project yang terdaftar\n- kasih link dan konteks ekosistem\n- bantu bandingkan kategori seperti DeFi, tools, bridge, dan infra\n- mengarahkan ke swap, staking, atau aksi wallet kalau relevan`
    );
  }

  if (lower.includes("wallet") || lower.includes("balance") || lower.includes("dompet")) {
    return say(
      hasWallet
        ? `Wallet lookup is not active in Signal Agent right now.\n\nFor live balances and wallet details, use the Profile page. I can still help with Seismic questions, project discovery, swap, transfer, and staking.`
        : `Wallet lookup is not active in Signal Agent right now.\n\nFor live balances and wallet details, use the Profile page after connecting your wallet. I can still help with Seismic questions, project discovery, swap, transfer, and staking.`,
      hasWallet
        ? `Pengecekan wallet belum aktif di Signal Agent saat ini.\n\nUntuk balance dan detail wallet secara live, pakai halaman Profile. Saya tetap bisa bantu soal Seismic, discovery project, swap, transfer, dan staking.`
        : `Pengecekan wallet belum aktif di Signal Agent saat ini.\n\nUntuk balance dan detail wallet secara live, pakai halaman Profile setelah connect wallet. Saya tetap bisa bantu soal Seismic, discovery project, swap, transfer, dan staking.`
    );
  }

  return say(
    `I can help with Seismic and Seismic Signal.\n\nTry asking about:\n- Seismic testnet basics\n- privacy features like SRC20 or signed reads\n- ecosystem projects in Seismic Signal\n- preparing a transfer, swap, or staking action\n\nIf you want an action, be specific with token, amount, and address.`,
    `Saya bisa bantu soal Seismic dan Seismic Signal.\n\nCoba tanya tentang:\n- dasar Seismic testnet\n- fitur privasi seperti SRC20 atau signed reads\n- project ekosistem di Seismic Signal\n- persiapan transfer, swap, atau staking\n\nKalau mau aksi langsung, tulis token, jumlah, dan address dengan jelas.`
  );
}

function normalizeTokenItem(item: any) {
  const symbol = String(
    item.symbol ||
      item.tokenSymbol ||
      item.TokenSymbol ||
      item.tokenName ||
      item.TokenName ||
      "TOKEN"
  ).toUpperCase();
  return {
    ...item,
    symbol,
    tokenSymbol: symbol,
    tokenDecimal: String(item.tokenDecimal || item.TokenDecimals || item.decimals || "18"),
    balance: String(item.balance || item.TokenQuantity || "0"),
  };
}

function getTokenItems(items: any[] = []) {
  const normalized = items.map(normalizeTokenItem);

  if (VERIFIED_TOKENS.length === 0) {
    return normalized;
  }

  return normalized.filter((item: any) => VERIFIED_TOKENS.includes(String(item.symbol || item.tokenSymbol || "").toUpperCase()));
}

function withExplorerKey(url: string) {
  if (!SOCIALSCAN_API_KEY) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}apikey=${encodeURIComponent(SOCIALSCAN_API_KEY)}`;
}

async function getExplorer(url: string) {
  const response = await axios.get(withExplorerKey(url), {
    timeout: 8000,
    headers: SOCIALSCAN_API_KEY
      ? {
          "x-api-key": SOCIALSCAN_API_KEY,
          Authorization: `Bearer ${SOCIALSCAN_API_KEY}`,
        }
      : undefined,
  });
  return response.data;
}

async function getExplorerTokenBalances(address: string) {
  return getExplorer(`${EXPLORER_API}?module=account&action=addresstokenbalance&address=${address}`);
}

async function getExplorerNftBalances(address: string) {
  return getExplorer(`${EXPLORER_API}?module=account&action=addresstokennftbalance&address=${address}`);
}

function isExplorerSuccess(response: any) {
  const status = String(response?.status ?? "");
  return status === "1" || response?.message === "OK";
}

function asArrayResult(response: any) {
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.result?.items)) return response.result.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

async function getExplorerNativeTxs(address: string) {
  return getExplorer(`${EXPLORER_API}?module=account&action=txlist&address=${address}&sort=desc`);
}

async function getExplorerTokenTxs(address: string) {
  return getExplorer(`${EXPLORER_API}?module=account&action=tokentx&address=${address}&sort=desc`);
}

router.get("/:address/history", walletDataLimiter, async (req, res) => {
  try {
    const { address } = req.params;
    if (!isAddress(address)) {
      return res.status(400).json({ success: false, message: "Invalid wallet address." });
    }
    
    const [nativeRes, tokenRes] = await Promise.allSettled([
      getExplorerNativeTxs(address),
      getExplorerTokenTxs(address),
    ]);

    let txs: any[] = [];
    let success = false;

    if (nativeRes.status === "fulfilled" && nativeRes.value.status === "1" && Array.isArray(nativeRes.value.result)) {
      txs = [...txs, ...nativeRes.value.result.map((tx: any) => ({ ...tx, tokenSymbol: "ETH", tokenDecimal: "18" }))];
      success = true;
    }

    if (tokenRes.status === "fulfilled" && tokenRes.value.status === "1" && Array.isArray(tokenRes.value.result)) {
      txs = [...txs, ...getTokenItems(tokenRes.value.result)];
      success = true;
    }

    if (txs.length === 0) {
      console.log(`[History] Explorer empty/failed for ${address}, falling back to RPC Logs...`);
      try {
        const ARSEI = process.env.ARSEI_TOKEN_ADDRESS as `0x${string}`;
        const WETH = process.env.SEISMIC_WETH_ADDRESS as `0x${string}`;

        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 90000n ? currentBlock - 90000n : 0n;

        const [sentLogs, receivedLogs] = await Promise.all([
          publicClient.getLogs({
            event: { type: "event", name: "Transfer", inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { name: "value", type: "uint256" }] },
            args: { from: address as `0x${string}` },
            fromBlock
          }),
          publicClient.getLogs({
            event: { type: "event", name: "Transfer", inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { name: "value", type: "uint256" }] },
            args: { to: address as `0x${string}` },
            fromBlock
          })
        ]);

        const combinedLogs = [...sentLogs, ...receivedLogs];
        const logTxs = await Promise.all(combinedLogs.map(async (log: any) => {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          const isSent = log.args.from?.toLowerCase() === address.toLowerCase();
          
          let symbol = "TOKEN";
          if (log.address.toLowerCase() === ARSEI?.toLowerCase()) symbol = "ARSEI";
          if (log.address.toLowerCase() === WETH?.toLowerCase()) symbol = "WETH";
          
          return {
            hash: log.transactionHash,
            timeStamp: String(block.timestamp),
            from: log.args.from,
            to: log.args.to,
            value: String(log.args.value),
            tokenSymbol: symbol,
            tokenDecimal: "18",
            isError: "0"
          };
        }));
        txs = logTxs;
        success = true;
      } catch (logErr) {
        console.error("RPC Fallback failed:", logErr);
      }
    }

    const result = txs.sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp)).slice(0, 100);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to fetch Seismic history:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch transaction history." });
  }
});

router.get("/:address/nfts", walletDataLimiter, async (req, res) => {
  try {
    const { address } = req.params;
    if (!isAddress(address)) {
      return res.status(400).json({ success: false, message: "Invalid wallet address." });
    }
    const response = await getExplorerNftBalances(address);

    if (isExplorerSuccess(response)) {
      const items = asArrayResult(response);
      const nfts = items.filter((token: any) => token.type === "ERC-721" || token.type === "ERC-1155");
      res.json({ success: true, data: nfts });
      return;
    }

    res.json({ success: true, data: [], message: response.message });
  } catch (error: any) {
    console.error("Failed to fetch Seismic NFTs:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch NFTs from the configured Seismic explorer." });
  }
});

router.get("/:address/tokens", walletDataLimiter, async (req, res) => {
  try {
    const { address } = req.params;
    if (!isAddress(address)) {
      return res.status(400).json({ success: false, message: "Invalid wallet address." });
    }
    const response = await getExplorerTokenBalances(address);

    if (isExplorerSuccess(response)) {
      res.json({ success: true, data: getTokenItems(asArrayResult(response)) });
      return;
    }

    res.json({ success: true, data: [] });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch verified token balances." });
  }
});

router.post("/agent/chat", chatLimiter, async (req, res) => {
  try {
    const { message, address, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, message: "Valid text message is required" });
    }

    if (message.length > 500) {
      return res.status(400).json({ success: false, message: "Message is too long. Max 500 characters." });
    }

    const sessionAddress = (req.session as any)?.siwe?.address;
    const verifiedAddress = address && sessionAddress === address ? address : undefined;

    if (!Array.isArray(history) || history.length > 20) {
      return res.status(400).json({ success: false, message: "Invalid chat history or length exceeded." });
    }

    const cleanHistory = sanitizeHistory(history);
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || "openai/gpt-oss-120b:groq";
    const JATEVO_API_KEY = process.env.JATEVO_API_KEY;
    const provider = HUGGINGFACE_API_KEY ? "huggingface" : JATEVO_API_KEY ? "jatevo" : null;

    console.log(`[SignalAgent] Request from: ${verifiedAddress || "anonymous"}`);

    if (
      !provider ||
      (provider === "jatevo" && JATEVO_API_KEY === "your_jatevo_api_key_here")
    ) {
      return res.json({ success: true, reply: buildLocalSignalReply(message, verifiedAddress), fallback: true });
    }

    let walletContext = "";
    if (verifiedAddress && verifiedAddress.startsWith("0x") && verifiedAddress.length === 42) {
      try {
        const [nativeBalance, tokenRes, nativeTxRes, tokenTxRes] = await Promise.allSettled([
          publicClient.getBalance({ address: verifiedAddress as `0x${string}` }),
          getExplorerTokenBalances(verifiedAddress),
          getExplorerNativeTxs(verifiedAddress),
          getExplorerTokenTxs(verifiedAddress),
        ]);

        const balances: string[] = [];

        if (nativeBalance.status === "fulfilled") {
          balances.push(`ETH: ${Number(formatEther(nativeBalance.value)).toFixed(4)}`);
        }

        if (tokenRes.status === "fulfilled" && isExplorerSuccess(tokenRes.value)) {
          getTokenItems(asArrayResult(tokenRes.value)).forEach((token: any) => {
            const symbol = String(token.symbol || "").toUpperCase();
            const decimals = Number(token.decimals || 18);
            const amount = (Number(token.balance) / 10 ** decimals).toFixed(4);
            balances.push(`${symbol}: ${amount}`);
          });
        }

        let combinedTxs: any[] = [];
        if (nativeTxRes.status === "fulfilled" && nativeTxRes.value.status === "1" && Array.isArray(nativeTxRes.value.result)) {
          combinedTxs = [...combinedTxs, ...nativeTxRes.value.result.map((tx: any) => ({ ...tx, tokenSymbol: "ETH", tokenDecimal: "18" }))];
        }
        if (tokenTxRes.status === "fulfilled" && tokenTxRes.value.status === "1" && Array.isArray(tokenTxRes.value.result)) {
          combinedTxs = [...combinedTxs, ...getTokenItems(tokenTxRes.value.result)];
        }

        const recentTxs: string[] = [];
        combinedTxs
          .sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp))
          .slice(0, 5)
          .forEach((tx: any) => {
            const symbol = String(tx.tokenSymbol || "ETH").toUpperCase();
            const direction = tx.from?.toLowerCase() === verifiedAddress.toLowerCase() ? "Sent" : "Received";
            const decimals = Number(tx.tokenDecimal || 18);
            const amount = (Number(tx.value) / 10 ** decimals).toFixed(4);
            const date = new Date(Number(tx.timeStamp) * 1000).toLocaleDateString();
            recentTxs.push(`- ${direction} ${amount} ${symbol} on ${date}`);
          });

        walletContext = `\n\n--- CONNECTED WALLET CONTEXT ---\nAddress: ${verifiedAddress}\n${balances.length > 0 ? `Balances:\n${balances.map((b) => `- ${b}`).join("\n")}` : "No verified token balances found."}\n${recentTxs.length > 0 ? `Recent Transactions:\n${recentTxs.join("\n")}` : "No recent verified token transactions found."}`;
      } catch {
        walletContext = `\n\n--- WALLET ---\nAddress: ${verifiedAddress} (Could not fetch live Seismic data)`;
      }
    }

    const projectContext = `\n\n--- SEISMIC SIGNAL PROJECT CONTEXT ---\n${projects
      .map((project) => `- ${project.name}:\n  Mission: ${project.description}\n  Category: ${project.category}\n  Links: [Reference: ${project.forumUrl || "N/A"}, X: ${project.twitterUrl || "N/A"}]`)
      .join("\n")}`;

    const systemContent = SEISMIC_SYSTEM_PROMPT + projectContext + walletContext;
    const messages = [
      { role: "system", content: systemContent },
      ...cleanHistory,
      { role: "user", content: message.replace(/</g, "&lt;").replace(/>/g, "&gt;") },
    ];

    const response = await axios.post(
      provider === "huggingface" ? "https://router.huggingface.co/v1/chat/completions" : "https://inference.jatevo.id/v1/chat/completions",
      {
        model: provider === "huggingface" ? HUGGINGFACE_MODEL : "glm-4.7",
        messages,
        stream: false,
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider === "huggingface" ? HUGGINGFACE_API_KEY : JATEVO_API_KEY}`,
        },
        timeout: 90000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim() || buildLocalSignalReply(message, verifiedAddress);
    res.json({ success: true, reply });
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error("SignalAgent API Error:", {
      status: error.response?.status,
      data: errorData,
      message: error.message,
    });

    if (error.response?.status === 401) {
      return res.status(401).json({ success: false, message: "AI provider key is invalid. Check your backend environment variables." });
    }

    const fallbackReply = buildLocalSignalReply(req.body?.message || "", (req.session as any)?.siwe?.address);
    res.status(200).json({ success: true, reply: fallbackReply, fallback: true });
  }
});

export default router;
