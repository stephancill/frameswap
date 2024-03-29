import { twMerge } from "tailwind-merge";

export function Heading({
  children,
  tw,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div tw={twMerge("mb-5 font-bold italic text-[48px] mb-10", tw)} {...props}>
      {children}
    </div>
  );
}
