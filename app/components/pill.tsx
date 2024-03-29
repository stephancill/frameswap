import { twMerge } from "tailwind-merge";

export function Pill({
  children,
  tw,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      tw={twMerge(
        "flex flex-row items-center bg-[#1B1B1B] border border-[#41434A] rounded-full",
        tw
      )}
      {...props}
    >
      {children}
    </div>
  );
}
