"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import useUserSession from "../../../../hooks/useUserSession";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract/contract";
import { getPublicClient } from "wagmi/actions";
import { ethers } from "ethers";
import { wagmiConfig } from "@/lib/wallet";

interface Election {
  id: string;
  title: string;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const publicClient = getPublicClient(wagmiConfig);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/user");
      return;
    }

    if (!user || user.role !== "admin") return;

    const fetchElections = async () => {
      const { data: electionsData } = await supabase
        .from("elections")
        .select("id, title");

      setElections((electionsData as Election[]) || []);
    };

    fetchElections();
  }, [user, loading, router]);

  const handleViewResult = async () => {
    if (!selectedElection) return;

    try {
      const electionIndex = parseInt(selectedElection);

      const encoded = await publicClient.readContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "winningName",
        args: [electionIndex],
      });

      const decoded = ethers.decodeBytes32String(encoded as string);
      setWinnerName(decoded);
    } catch (err) {
      console.error("Failed to read winning name:", err);
      alert("Could not fetch winner from blockchain.");
    }
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-blue-700">
      <h1 className="text-2xl font-bold mb-6">Admin View Results 🏆</h1>

      <div className="space-y-4">
        <select
          className="p-2 rounded border w-full"
          value={selectedElection}
          onChange={(e) => setSelectedElection(e.target.value)}
        >
          <option value="">Select an Election</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>

        <button
          disabled={!selectedElection}
          onClick={handleViewResult}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Show Winner
        </button>

        {winnerName && (
          <div className="bg-white shadow p-6 rounded-xl text-center mt-6">
            <h2 className="text-xl font-semibold text-green-700">
              🏆 Winner: {winnerName}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
