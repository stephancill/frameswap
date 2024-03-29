import { APP_URL } from "../env";

export function Logo() {
  return (
    <div>
      <img tw="w-[600px] h-[131px]" src={`${APP_URL}/frameswap.svg`} alt="" />
    </div>
  );
}
