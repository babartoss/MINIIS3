"use client";

import dynamic from "next/dynamic";
import { APP_NAME } from "@/lib/constants";  // Đã sửa path

// Dynamic import để tránh SSR issue với Frame SDK
const AppComponent = dynamic(() => import("@/components/App"), {  // Thay ~ thành @
  ssr: false,
});

export default function App(
  { _title }: { _title?: string } = { _title: APP_NAME }
) {
  return <AppComponent _title={_title} />;
}