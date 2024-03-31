import { twMerge } from "tailwind-merge";
import { getClient } from "../client";
import { CHAIN_SYMBOLS } from "../const";
import { getTokenInfo } from "../token";
import { formatUsdDisplay, formatUsdPriceDisplay } from "../utils";
import { ChainIcon } from "./chain-icon";
import { Pill } from "./pill";

export function TokenDetail({
  tokenInfo,
}: {
  tokenInfo: NonNullable<Awaited<ReturnType<typeof getTokenInfo>>>;
}) {
  const chainName = tokenInfo.chainId
    ? getClient({ chainIdOrName: tokenInfo.chainId }).chainName
    : null;

  return (
    <Pill>
      <div tw="p-5 items-center">
        <div tw={chainName && CHAIN_SYMBOLS.includes(chainName) ? "mr-4" : ""}>
          <div tw="relative">
            <div tw="h-20 w-20 rounded-full overflow-hidden">
              {tokenInfo.image ? (
                <img
                  tw="h-20 w-20"
                  src={tokenInfo.image}
                  width={80}
                  height={80}
                />
              ) : (
                <div tw="bg-gray-500 w-full h-full items-center justify-center font-bold text-[48px]">
                  {tokenInfo.symbol[0]}
                </div>
              )}
            </div>
            {chainName && CHAIN_SYMBOLS.includes(chainName) && (
              <div tw="absolute h-10 w-10 -right-3 -bottom-1 bg-white items-center justify-center rounded-full overflow-hidden">
                <ChainIcon tw="w-full h-full" chainName={chainName} />
              </div>
            )}
          </div>
        </div>

        <div tw="flex flex-col mr-2 ml-4">
          <div tw="font-bold text-[36px]">{tokenInfo.symbol}</div>
          <div tw="text-[30px]">{tokenInfo.name}</div>
        </div>

        {tokenInfo.priceData && (
          <div>
            <div>
              <div tw="h-[70px] w-[1px] bg-[#41434A] mx-4"></div>
            </div>
            <div tw="items-center flex flex-col">
              <div tw="mr-1">
                ${formatUsdPriceDisplay(tokenInfo.priceData.price)}
              </div>
              <div
                tw={twMerge(
                  "ml-2 text-[30px]",
                  tokenInfo.priceData.priceChangePercentage24h > 0
                    ? "text-green-500"
                    : "text-gray-500"
                )}
              >
                {tokenInfo.priceData.priceChangePercentage24h > 0 ? "+" : ""}
                {formatUsdDisplay(tokenInfo.priceData.priceChangePercentage24h)}
                %
              </div>
            </div>
          </div>
        )}
      </div>
    </Pill>
  );
}
