export function Pill(props: { children: React.ReactNode }) {
  return (
    <div tw="flex flex-row items-center bg-[#1B1B1B] text-white border border-[#41434A] rounded-full">
      {props.children}
    </div>
  );
}
