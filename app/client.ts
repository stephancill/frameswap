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


export function getClient({chainIdOrName}: {chainIdOrName: number | string}) {
  const chainId = typeof chainIdOrName === "number" ? chainIdOrName : chainByName[chainIdOrName].id;
  const chain = Object.values(chains).find((c) => c.id === chainId);

  return createPublicClient({
    transport: http(),
    chain,
  })
}