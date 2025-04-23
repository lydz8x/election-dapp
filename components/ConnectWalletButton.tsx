"use client";

import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
// import { injected } from "wagmi/connectors";
import { supabase } from "@/lib/supabase";

export default function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const injectedConnector = connectors.find((c) => c.id === "injected");

  useEffect(() => {
    const saveWallet = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (userId && address) {
        await supabase
          .from("users")
          .update({ wallet_address: address })
          .eq("id", userId);
      }
    };
    if (isConnected && address) {
      saveWallet();
    }
  }, [isConnected, address]);
  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <span>
            {address!.slice(0, 6)}...{address!.slice(-4)}
          </span>
          <button
            className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => {
            if (injectedConnector) connect({ connector: injectedConnector });
          }}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
