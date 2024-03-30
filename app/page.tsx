import { fetchMetadata } from "frames.js/next";
import { Metadata } from "next";
import { Logo } from "./components/logo";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "FRAMESWAP",
    description:
      "The easiest way to share and invest in tokens straight from your feed.",
    other: {
      ...(await fetchMetadata(
        new URL("/frames", process.env.APP_URL || "http://localhost:3000")
      )),
    },
  };
}

export default async function Home() {
  return <div>Frameswap</div>;
}
