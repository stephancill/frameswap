import { publicActionReverseMirage } from "reverse-mirage";
import { getClient } from "./client";

export async function getTokenInfo({
  tokenAddress,
  blockchain,
}: {
  tokenAddress: string;
  blockchain: string | number;
}): Promise<{
  symbol: string;
  name: string;
  url: string;
  image?: string;
} | null> {
  const client = getClient({ chainIdOrName: blockchain }).extend(
    publicActionReverseMirage
  );

  try {
    const [coingecko, onchain] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${blockchain}/contract/${tokenAddress}`
      ),
      client.getERC20({
        erc20: {
          address: tokenAddress as `0x${string}`,
          chainID: client.chain.id,
        },
      }),
    ]);

    if (coingecko.ok) {
      const json = await coingecko?.json();
      return {
        symbol: json.symbol.toUpperCase(),
        name: json.name,
        image: json.image?.small,
        url: `https://www.coingecko.com/en/coins/${json.id}`,
      };
    }

    return {
      symbol: onchain.symbol.toUpperCase(),
      name: onchain.name,
      url: `https://app.uniswap.org/tokens/${blockchain}/${tokenAddress}`,
    };
  } catch (error) {
    console.log("error", error);
    return null;
  }
}
