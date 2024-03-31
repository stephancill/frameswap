import type { Execute } from "@reservoir0x/relay-sdk";
import type {
  CurrencyAmount,
  MethodParameters,
} from "@uniswap/smart-order-router";
import type { getSwapTransaction } from "../uniswap";
import { TokenInfo } from "../token";

export type SwapRouteSerialized = {
  methodParameters: MethodParameters | undefined;
  quote: { currency: CurrencyAmount["currency"]; amount: string };
  gasPriceWei: string;
  estimatedGasUsedUSD: {
    amount: string;
    currency: CurrencyAmount["currency"];
  };
  estimatedGasUsed: string;
};

export type KVTransacted = {
  steps: Execute["steps"];
  quote: SwapRouteSerialized;
  params: Parameters<typeof getSwapTransaction>[0];
  tokenInfo: TokenInfo;
};

export type KVQuote = {
  loading?: boolean;
  error?: string;
  quote: SwapRouteSerialized;
  params: Parameters<typeof getSwapTransaction>[0];
  tokenInfo: TokenInfo;
};
