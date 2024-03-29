import { APP_URL } from "../env";

export function Scaffold({ children: element }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex", // Use flex layout
        flexDirection: "row", // Align items horizontally
        alignItems: "stretch", // Stretch items to fill the container height
        position: "relative", // Required for absolute positioning of the icon
        width: "100%",
        height: "100vh", // Full viewport height
        backgroundColor: "#131313",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          lineHeight: 1.2,
          fontSize: 36,
          color: "white",
          flex: 1,
          overflow: "hidden",
        }}
      >
        {element}
      </div>
      {/* Icon container */}
      <div tw="absolute bottom-[38%] right-8">
        <img tw="h-10 w-10" src={`${APP_URL}/icon.svg`} alt="" />
      </div>
    </div>
  );
}
