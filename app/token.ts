import { publicActionReverseMirage } from "reverse-mirage";
import { getClient } from "./client";
import { isAddress } from "viem";
import { TESTNET_ENABLED } from "./env";
import { COINGECKO_CHAIN_OVERRIDES } from "./const";

export type TokenInfo = {
  id?: string;
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  url: string;
  image?: string;
};

export async function getTokenInfo({
  addressOrId: addressOrId,
  chainIdOrName: chainIdOrName,
}: {
  addressOrId: string;
  chainIdOrName?: string | number;
}): Promise<TokenInfo | null> {
  const coingeckoUrl =
    isAddress(addressOrId) && chainIdOrName
      ? `https://api.coingecko.com/api/v3/coins/${
          getClient({ chainIdOrName }).chainName
        }/contract/${addressOrId}`
      : `https://api.coingecko.com/api/v3/coins/${addressOrId}`;

  try {
    const [coingecko, onchain] = await Promise.all([
      fetch(coingeckoUrl, {
        next: {
          revalidate: 3600,
        },
      }),
      isAddress(addressOrId) && chainIdOrName
        ? getClient({ chainIdOrName })
            .extend(publicActionReverseMirage)
            .getERC20({
              erc20: {
                address: addressOrId as `0x${string}`,
                chainID: getClient({ chainIdOrName }).chain.id,
              },
            })
        : null,
    ]);

    if (coingecko.ok) {
      const json = await coingecko?.json();

      const [chainName, address] = Object.entries(json.platforms)[0] as [
        string,
        string
      ];

      const client = getClient({
        chainIdOrName:
          chainIdOrName || COINGECKO_CHAIN_OVERRIDES[chainName]
            ? COINGECKO_CHAIN_OVERRIDES[chainName]
            : chainName,
      });

      return {
        id: json.id,
        symbol: json.symbol.toUpperCase(),
        name: json.name,
        image: json.image?.small,
        chainId: client.chain.id,
        address,
        url: `https://www.coingecko.com/en/coins/${json.id}`,
      };
    }

    if (!onchain) {
      throw new Error("Could not find token");
    }

    return {
      symbol: onchain.symbol.toUpperCase(),
      name: onchain.name,
      url: `https://app.uniswap.org/tokens/${chainIdOrName}/${addressOrId}`,
      address: addressOrId,
      chainId: getClient({ chainIdOrName: chainIdOrName! }).chain.id,
    };
  } catch (error) {
    console.log("error", error);
    return null;
  }
}

export async function searchTokens({
  query,
}: {
  query: string;
}): Promise<TokenInfo[]> {
  try {
    const coingecko = await fetch(
      `https://www.coingecko.com/en/search_v2?query=${query}`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!coingecko.ok) {
      throw new Error("Could not search tokens");
    }

    const json = await coingecko.json();

    return json.coins.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.thumb,
      url: `https://www.coingecko.com/en/coins/${coin.id}`,
    }));
  } catch (error) {
    console.log("error", error);
    return [];
  }
}
