import { Chain, createPublicClient, http } from "viem";
import { TESTNET_ENABLED, publicClient, reservoirClient } from "./client";
import { CallBody, Execute } from "@reservoir0x/relay-sdk";
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
import { getPrice } from "@ensdomains/ensjs/public";
import { makeRenewTxData } from "./ens/makeRenewTxData";
import { serializeJsx } from "./renderImage";
import { Scaffold } from "./components/scaffold";

export function numberWithCommas(x: string | number) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatExpiration(expiryDate: Date): string {
  const now = new Date();
  let output = "";
  const yearsDiff = expiryDate.getFullYear() - now.getFullYear();
  const monthsDiff = expiryDate.getMonth() - now.getMonth();
  const daysDiff = expiryDate.getDate() - now.getDate();

  let adjustedYears = yearsDiff;
  let adjustedMonths = monthsDiff;
  let adjustedDays = daysDiff;

  if (daysDiff < 0) {
    // Handle the case where days are negative
    adjustedMonths -= 1;
    // Find the last day of the previous month
    const lastDayOfPrevMonth = new Date(
      expiryDate.getFullYear(),
      expiryDate.getMonth(),
      0
    ).getDate();
    adjustedDays = lastDayOfPrevMonth + daysDiff;
  }

  if (monthsDiff < 0) {
    // Handle the case where months are negative
    adjustedYears -= 1;
    adjustedMonths = 12 + monthsDiff;
  }

  // Constructing the output string
  if (adjustedYears > 0) {
    output += adjustedYears + "y";
    if (adjustedMonths > 0) {
      output += " " + adjustedMonths + "mo";
    }
  } else if (adjustedMonths > 0) {
    output += adjustedMonths + "mo";
    if (adjustedDays > 0) {
      // Optionally add days to the month output
      // output += ' and ' + adjustedDays + (adjustedDays === 1 ? ' day' : ' days');
    }
  } else if (adjustedDays > 0) {
    output += adjustedDays + "d";
  } else {
    // In case the expiration is today or somehow past
    output = "expires today or is already expired";
  }

  return output;
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
  console.log(`fetch ${`${reservoirClient.baseApiUrl}/execute/call`}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const relayResponse = await fetch(
    `${reservoirClient.baseApiUrl}/execute/call`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

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

export async function calculateEnsRenewalAuto({
  renewalYears,
  name,
  connectedAddress,
}: {
  renewalYears: number;
  name: string;
  connectedAddress: string;
}) {
  const duration = 31536000 * renewalYears;
  const [{ base: basePrice, premium }, chainBalances] = await Promise.all([
    getPrice(publicClient, {
      nameOrNames: name,
      duration,
    }),
    getBalancesOnChains({
      address: connectedAddress as `0x${string}`,
      // https://docs.relay.link/resources/supported-chains#supported-chains
      chains: TESTNET_ENABLED
        ? [baseSepolia]
        : [zora, base, arbitrum, arbitrumNova, optimism, linea, zkSync],
    }),
  ]);

  const value = ((basePrice + premium) * BigInt(110)) / BigInt(100); // add 10% to the price for buffer
  const tx = makeRenewTxData(publicClient, {
    nameOrNames: name,
    duration,
    value,
  });

  const autoChainId = chainBalances[0]?.chain.id;

  if (!autoChainId) {
    throw new Error("No chain found with balance");
  }

  return {
    tx,
    fundsChainId: autoChainId,
  };
}

export function imageUrl(image: JSX.Element) {
  const imageJson = JSON.stringify(serializeJsx(<Scaffold>{image}</Scaffold>));
  const imageUrl = `${new URL(
    "/images",
    vercelURL() || process.env.APP_URL
  ).toString()}?${new URLSearchParams({ jsx: imageJson }).toString()}`;
  return imageUrl;
}

export function vercelURL() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;
}
