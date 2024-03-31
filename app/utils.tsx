import {
  CallBody,
  Execute,
  MAINNET_RELAY_API,
  TESTNET_RELAY_API,
} from "@reservoir0x/relay-sdk";
import { Chain, createPublicClient, formatEther, http } from "viem";
import {
  arbitrum,
  arbitrumNova,
  base,
  baseSepolia,
  linea,
  mainnet,
  optimism,
  zkSync,
  zora,
} from "viem/chains";
import { APP_URL, TESTNET_ENABLED } from "./env";

export function numberWithCommas(x: string | number) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export async function getEthUsdPrice(ether?: number | bigint): Promise<number> {
  // roundId uint80, answer int256, startedAt uint256, updatedAt uint256, answeredInRound uint80
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  });

  const [, answer] = await publicClient.readContract({
    abi: [
      {
        inputs: [],
        name: "latestRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "latestRoundData",
    // https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1&search=usdc#ethereum-mainnet
    address: "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4",
  });

  const etherValue = typeof ether === "bigint" ? Number(ether) : ether;
  const ethPriceUsd = (1 / Number(answer)) * (etherValue ?? 1e18);

  return ethPriceUsd;
}

export async function getBalancesOnChains({
  address,
  chains,
  minBalance = BigInt(0),
}: {
  address: `0x${string}`;
  chains: Chain[];
  minBalance?: bigint;
}) {
  const balances = await Promise.all(
    chains.map(async (chain) => {
      const client = createPublicClient({
        transport: http(),
        chain,
      });
      const balance = await client.getBalance({ address });
      return {
        chain,
        balance,
      };
    })
  );
  return balances
    .filter((b) => b.balance > minBalance)
    .sort((a, b) => Number(b.balance - a.balance));
}

export async function createRelayCall(data: CallBody) {
  const relayApiUrl = TESTNET_ENABLED ? TESTNET_RELAY_API : MAINNET_RELAY_API;

  console.log(`fetch ${`${relayApiUrl}/execute/call`}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const relayResponse = await fetch(`${relayApiUrl}/execute/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (relayResponse.status !== 200) {
    const data = await relayResponse.json();
    console.error(data);
    throw new Error(
      `Failed to execute call: ${data.message} status: ${relayResponse.status}`
    );
  }
  const call = (await relayResponse.json()) as Execute;

  return call;
}

export function formatUsdDisplay(usd: number | string) {
  const usdNumber = typeof usd === "string" ? parseFloat(usd) : usd;

  return numberWithCommas(
    // People don't care about cents when it's over $100
    usdNumber > 100 ? usdNumber.toPrecision(3) : usdNumber.toFixed(2)
  );
}

export function formatUsdPriceDisplay(usd: number | string) {
  const usdNumber = typeof usd === "string" ? parseFloat(usd) : usd;

  return numberWithCommas(usdNumber.toPrecision(4));
}

export function formatEtherDisplay(eth: bigint) {
  return parseFloat(formatEther(eth)).toPrecision(4);
}

export async function createRelayCallAuto({
  connectedAddress,
  call,
}: {
  connectedAddress: `0x${string}`;
  call: Omit<CallBody, "originChainId" | "user">;
}) {
  console.log({ TESTNET_ENABLED });

  const [chainBalances] = await Promise.all([
    getBalancesOnChains({
      address: connectedAddress,
      // https://docs.relay.link/resources/supported-chains#supported-chains
      chains: TESTNET_ENABLED ? [baseSepolia] : [zora, base, optimism], // Arbitrum is not supported by warpcast
    }),
  ]);

  const autoChainId = chainBalances[0]?.chain.id;

  if (!autoChainId) {
    throw new Error("No chain found with balance");
  }

  const { steps } = await createRelayCall({
    ...call,
    user: connectedAddress,
    originChainId: autoChainId,
  });
  const relayTxData = steps[0].items?.[0].data;

  return {
    steps,
    tx: relayTxData,
    fundsChainId: autoChainId,
  };
}

export function vercelURL() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
}

export function camelToSnakeCase(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function formatWarpcastIntentUrl({
  chain,
  address,
  text,
}: {
  chain: string | number;
  address: string;
  text?: string;
}) {
  const frameUrl = `${APP_URL}/frames/${chain}/${address}`;

  const searchParams = new URLSearchParams({
    text: text ?? "",
    ["embeds[]"]: frameUrl,
  });

  return `https://warpcast.com/~/compose?${searchParams.toString()}`;
}
