import { twMerge } from "tailwind-merge";
import { APP_URL } from "../env";
import { CHAIN_SYMBOLS } from "../const";

export function ChainIcon({
  chainName,
  tw,
  ...props
}: { chainName: string } & React.HTMLAttributes<HTMLImageElement>) {
  return (
    <img
      tw={twMerge("w-10 h-10", tw)}
      src={`${APP_URL}/chain-symbols/${chainName}.svg`}
      {...props}
    />
  );
}
