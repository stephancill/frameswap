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
import { SwapRouteSerialized } from "./frames/types";
import { kv } from "@vercel/kv";

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

export async function getAndPersistSwapTransaction({
  key,
  quoteParams,
}: {
  quoteParams: Parameters<typeof getSwapTransaction>[0];
  key: string;
}) {
  await kv.set(key, JSON.stringify({ loading: true }));

  return await getSwapTransaction(quoteParams)
    .then((quote) => {
      // Set value in kv
      if (!quote) {
        throw new Error("Quote not found");
      }

      const newQuote: SwapRouteSerialized = {
        methodParameters: quote.methodParameters,
        quote: {
          currency: quote.quote.currency,
          amount: quote.quote.toExact(),
        },
        gasPriceWei: quote.gasPriceWei.toString(),
        estimatedGasUsedUSD: {
          amount: quote.estimatedGasUsedUSD.toExact(),
          currency: quote.estimatedGasUsedUSD.currency,
        },
        estimatedGasUsed: quote.estimatedGasUsed.toString(),
      };
      const value = {
        quote: newQuote,
        params: quoteParams,
      };
      kv.set(key, JSON.stringify(value));
    })
    .catch((e) => {
      console.error(e);
      kv.set(key, JSON.stringify({ error: e.message }));
    });
}
