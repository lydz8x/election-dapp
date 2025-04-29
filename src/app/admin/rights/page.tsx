"use client";

import { useEffect, useState } from "react";
import { useWriteContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract/contract";
import { supabase } from "@/lib/supabase";
import useUserSession from "../../../../hooks/useUserSession";
import { useRouter } from "next/navigation";

type Election = {
  id: string;
  title: string;
  election_index: number | null;
};

type User = {
  id: string;
  name: string;
  wallet_address: string | null;
};

export default function AdminRightsPage() {
  const { user, loading } = useUserSession();
  const router = useRouter();
  const { writeContractAsync, isPending, isSuccess, error } =
    useWriteContract();

  const [elections, setElections] = useState<Election[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/user");
      return;
    }

    const fetchData = async () => {
      const { data: electionsData } = await supabase
        .from("elections")
        .select("id, title, election_index");

      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, wallet_address")
        .eq("status", "approved");

      setElections(electionsData || []);
      setUsers((usersData || []).filter((u) => u.wallet_address));
    };

    fetchData();
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;

  const handleGrantRight = async (walletAddress: string, userId: string) => {
    if (!selectedElectionId) {
      alert("Please select an election first!");
      return;
    }

    const selectedElection = elections.find((e) => e.id === selectedElectionId);
    if (!selectedElection) {
      alert("Invalid election selected.");
      return;
    }

    const electionIndex = selectedElection.election_index;
    if (typeof electionIndex !== "number") {
      alert("Election index missing.");
      return;
    }

    try {
      const txHash = await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "giveRightToVote",
        args: [electionIndex, walletAddress, 1],
      });

      console.log("Transaction hash:", txHash);

      // ✅ Save to Supabase
      const { error: supaErr } = await supabase.from("voting_rights").insert({
        election_id: selectedElection.id,
        user_id: userId,
        granted_at: new Date().toISOString(),
      });

      if (supaErr) {
        console.error("Failed to insert voting_rights:", supaErr);
        alert("Chain success, but Supabase insert failed.");
      } else {
        alert("Right granted! ✅");
      }
    } catch (err) {
      console.error("Failed to give right to vote:", err);
      alert("Grant right to vote failed.");
    }
  };

  // Grant all
  const handleGrantAll = async () => {
    if (!selectedElectionId) {
      alert("Select an election first!");
      return;
    }

    const selectedElection = elections.find((e) => e.id === selectedElectionId);
    if (!selectedElection) {
      alert("Invalid election selected.");
      return;
    }

    const electionIndex = selectedElection.election_index;
    if (typeof electionIndex !== "number") {
      alert("Election index missing.");
      return;
    }

    for (const user of users) {
      if (!user.wallet_address) continue;

      await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "giveRightToVote",
        args: [electionIndex, user.wallet_address, 1],
      });
    }

    alert("All users granted voting rights!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        Grant Voting Rights
      </h1>

      {/* Election Selector */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-blue-700">
          Select Election:
        </label>
        <select
          className="w-full p-2 border rounded-md text-blue-600"
          value={selectedElectionId}
          onChange={(e) => setSelectedElectionId(e.target.value)}
        >
          <option value="">-- Select Election --</option>
          {elections.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {selectedElectionId ? (
        <>
          <button
            onClick={handleGrantAll}
            className="mb-4 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded w-full"
          >
            🚀 Grant Right to All Users
          </button>

          <div className="overflow-x-auto bg-white p-4 rounded-lg shadow">
            <table className="w-full table-auto text-sm text-left text-blue-600">
              <thead className="bg-blue-100 text-blue-700 font-semibold">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Wallet</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.wallet_address}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() =>
                          handleGrantRight(u.wallet_address!, u.id)
                        }
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                      >
                        Grant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-center text-blue-500">
          Please select an election first.
        </p>
      )}

      {/* Transaction feedback */}
      <div className="text-sm text-center mt-4 text-blue-600">
        {isPending && <p>Transaction is pending...</p>}
        {isSuccess && <p className="text-green-600">Vote right granted!</p>}
        {error && <p className="text-red-600">Transaction failed.</p>}
      </div>
    </div>
  );
}
