import { getTokenInfo } from "../token";
import { Pill } from "./pill";

export function TokenDetail({
  tokenInfo,
}: {
  tokenInfo: NonNullable<Awaited<ReturnType<typeof getTokenInfo>>>;
}) {
  return (
    <Pill>
      <div tw="p-5">
        {tokenInfo.image && (
          <div tw="mr-4">
            <img src={tokenInfo.image} width={80} height={80} />
          </div>
        )}
        <div tw="flex flex-col">
          <div tw="font-bold text-[36px]">{tokenInfo.name}</div>
          <div tw="font-bold text-[30px]">{tokenInfo.symbol}</div>
        </div>
      </div>
    </Pill>
  );
}
