import { Protocol } from "@uniswap/router-sdk";
import { Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  AlphaRouterConfig,
  CurrencyAmount,
  SwapOptions,
  SwapType,
  nativeOnChain,
} from "@uniswap/smart-order-router";
import { ethers } from "ethers";
import JSBI from "jsbi";
import { publicActionReverseMirage } from "reverse-mirage";
import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";

export const chainByName: { [key: string]: chains.Chain } = Object.entries(
  chains
).reduce(
  (acc: { [key: string]: chains.Chain }, [key, chain]) => {
    acc[key] = chain;
    return acc;
  },
  { ethereum: chains.mainnet } // Convenience for ethereum, which is 'homestead' otherwise
);

export const chainById = Object.values(chains).reduce(
  (acc: { [key: number]: chains.Chain }, cur) => {
    if (cur.id) acc[cur.id] = cur;
    return acc;
  },
  {}
);
chainById[1] = { ...chains.mainnet }; // Convenience: rename 'homestead' to 'ethereum'

export async function getEthUsdPrice(): Promise<number> {
  const client = createPublicClient({
    transport: http(),
    chain: chains.mainnet,
  });

  // roundId uint80, answer int256, startedAt uint256, updatedAt uint256, answeredInRound uint80
  const [, answer] = await client.readContract({
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

  const ethPriceUsd = (1 / Number(answer)) * 1e18;

  return ethPriceUsd;
}

export async function getSwapTransaction({
  outTokenAddress,
  chainId: chainId,
  ethInputAmountFormatted,
  recipientAddress,
  feeRecipientAddress,
  feePercentageInt,
}: {
  outTokenAddress: string;
  chainId: number;
  ethInputAmountFormatted: string;
  recipientAddress: string;
  feePercentageInt?: number;
  feeRecipientAddress?: string;
}) {
  const tokenOut = await getUniswapToken({
    tokenAddress: outTokenAddress,
    chainId,
  });

  const chain = chainById[chainId];

  // https://github.com/ethers-io/ethers.js/issues/4469#issuecomment-1932145334
  const provider = new ethers.providers.JsonRpcProvider({
    url: chain.rpcUrls.default.http[0],
    skipFetchSetup: true,
  });

  const router = new AlphaRouter({
    chainId: chain.id,
    provider,
  });

  const tokenIn = nativeOnChain(chain.id);
  const amountIn = CurrencyAmount.fromRawAmount(
    tokenIn,
    JSBI.BigInt(
      ethers.utils.parseUnits(ethInputAmountFormatted, tokenIn.decimals)
    )
  );

  let swapOptions: SwapOptions = {
    type: SwapType.UNIVERSAL_ROUTER,
    recipient: recipientAddress,
    slippageTolerance: new Percent(5, 100),
    deadlineOrPreviousBlockhash: parseDeadline("360"),
    fee:
      feeRecipientAddress && feePercentageInt
        ? {
            fee: new Percent(feePercentageInt, 100),
            recipient: feeRecipientAddress,
          }
        : undefined,
  };

  const partialRoutingConfig: Partial<AlphaRouterConfig> = {
    protocols: [Protocol.V2, Protocol.V3],
  };

  const quote = await router.route(
    amountIn,
    tokenOut,
    TradeType.EXACT_INPUT,
    swapOptions,
    partialRoutingConfig
  );

  if (!quote) return;
  return quote;
}

async function getUniswapToken({
  tokenAddress,
  chainId,
}: {
  tokenAddress: string;
  chainId: number;
}): Promise<Token> {
  const chain = chainById[chainId];
  const client = createPublicClient({
    transport: http(),
    chain,
  }).extend(publicActionReverseMirage);

  const token = await client.getERC20({
    erc20: {
      address: tokenAddress as `0x${string}`,
      chainID: chain.id,
    },
  });

  const uniswapToken = new Token(
    chain.id,
    tokenAddress,
    token.decimals,
    token.symbol,
    token.name
  );

  return uniswapToken;
}

function parseDeadline(deadline: string): number {
  return Math.floor(Date.now() / 1000) + parseInt(deadline);
}
