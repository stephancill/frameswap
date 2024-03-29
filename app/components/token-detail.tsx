import { getTokenInfo } from "../token";

export function TokenDetail({
  tokenInfo,
}: {
  tokenInfo: NonNullable<Awaited<ReturnType<typeof getTokenInfo>>>;
}) {
  return (
    <div tw="flex flex-row items-center">
      {tokenInfo.image && (
        <div tw="mr-4">
          <img src={tokenInfo.image} width={80} height={80} />
        </div>
      )}
      <div tw="flex flex-col">
        <div>{tokenInfo.name}</div>
        <div>{tokenInfo.symbol}</div>
      </div>
    </div>
  );
}
