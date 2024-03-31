import { COINGECKO_CACHE_TTL as COINGECKO_CACHE_TTL_RAW } from "./env";

export const DUMMY_TX_ADDRESS = "0xBB8181dD8D0fD463Dbc35152590f0FC33306dE28";
export const SEARCH_ADDRESS_OR_ID_STEP = "nameOrId";

export const COINGECKO_CACHE_TTL = COINGECKO_CACHE_TTL_RAW || "3600";

export const CHAIN_SYMBOLS = [
  "arbitrum",
  "avax",
  "base",
  "bnb",
  "celo",
  "ethereum",
  "optimism",
  "polygon",
];

export const COINGECKO_CHAIN_OVERRIDES: Record<string, string> = {
  "optimistic-ethereum": "optimism",
  "arbitrum-one": "arbitrum",
};
