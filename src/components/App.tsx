// File: src/components/App.tsx (Updated)
"use client";

import { useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { HomeTab, ParticipantsTab, RewardTab, WalletTab } from "@/components/ui/tabs";  // Thay RewardTap thành RewardTab
import { USE_WALLET } from "@/lib/constants";
import { useNeynarUser } from "../hooks/useNeynarUser";

// --- Types ---
export enum Tab {
  Home = "home",
  Participants = "participants",  // Thay actions
  Reward = "reward",  // Thay context
  Wallet = "wallet",
}

export interface AppProps {
  title?: string;
}

export default function App(
  { title }: AppProps = { title: "Hello MINIIS3" }
) {
  const {
    isSDKLoaded,
    context,
    setInitialTab,
    setActiveTab,
    currentTab,
  } = useMiniApp();

  const { user: neynarUser } = useNeynarUser(context || undefined);

  useEffect(() => {
    if (isSDKLoaded) {
      setInitialTab(Tab.Home);
    }
  }, [isSDKLoaded, setInitialTab]);

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p>Loading SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <Header neynarUser={neynarUser} />

      <div className="container py-2 pb-20">
        {currentTab === Tab.Home && <HomeTab />}
        {currentTab === Tab.Participants && <ParticipantsTab />}
        {currentTab === Tab.Reward && <RewardTab />}
        {currentTab === Tab.Wallet && <WalletTab />}

        <Footer activeTab={currentTab as Tab} setActiveTab={setActiveTab} showWallet={USE_WALLET} />
      </div>
    </div>
  );
}