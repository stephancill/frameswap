import { createPublicClient, http } from "viem";
import * as chains from "viem/chains";
import { camelToSnakeCase } from "./utils";

export const chainByName: { [key: string]: chains.Chain } = Object.entries(
  chains
).reduce(
  (acc: { [key: string]: chains.Chain }, [key, chain]) => {
    acc[key] = chain;
    return acc;
  },
  { ethereum: chains.mainnet } // Convenience for ethereum, which is 'homestead' otherwise
);

export function getClient({
  chainIdOrName,
}: {
  chainIdOrName: number | string;
}) {
  const chainId =
    typeof chainIdOrName === "number"
      ? chainIdOrName
      : chainByName[chainIdOrName].id;
  const entry = Object.entries(chains).find(
    ([name, chain]) => chain.id === chainId
  );

  const [chainNameRaw, chain] = entry || [];

  const chainName = camelToSnakeCase(chainNameRaw!);

  return createPublicClient({
    transport: http(),
    chain,
  }).extend((client) => ({ chainName, chainId }));
}
