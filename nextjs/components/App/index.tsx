"use client";

import { Spinner } from "@/components/Spinner";
import dynamic from "next/dynamic";

const Home = dynamic(
  () => import("@/components/Home").then((mod) => mod.Home),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-screen w-screen">
        <Spinner />
      </div>
    ),
  }
);

export default function App() {
  return <Home />;
}
