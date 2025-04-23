"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useUserSession from "../../../../hooks/useUserSession";

type User = {
  id: string;
  name: string;
  email: string;
  student_id: string;
  wallet_address: string;
};

type Election = {
  id: string;
  title: string;
};

export default function GiveRightToVotePage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
  const [grantedUserIds, setGrantedUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRights, setLoadingRights] = useState<boolean>(false);

  // Load elections and approved users
  useEffect(() => {
    const fetchMeta = async () => {
      const [electionsRes, usersRes] = await Promise.all([
        supabase.from("elections").select("id, title"),
        supabase
          .from("users")
          .select("id, name, email, student_id, wallet_address")
          .eq("status", "approved"),
      ]);

      if (electionsRes.data) setElections(electionsRes.data);
      if (usersRes.data) setApprovedUsers(usersRes.data);
    };

    if (user) fetchMeta();
  }, [user]);

  // Load granted voting rights for the selected election
  useEffect(() => {
    const fetchRights = async () => {
      if (!selectedElection) return;

      setLoadingRights(true);
      const { data, error } = await supabase
        .from("voting_rights")
        .select("user_id")
        .eq("election_id", selectedElection);

      if (data) {
        const ids = data.map((r) => r.user_id);
        setGrantedUserIds(ids);
      }
      if (error) setError(error.message);

      setLoadingRights(false);
    };

    fetchRights();
  }, [selectedElection]);

  // Role guard: only admin can access this page
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/user");
    }
  }, [user, loading, router]);

  const handleGrantRight = async (userId: string) => {
    if (!selectedElection) return;

    const { error } = await supabase.from("voting_rights").insert({
      election_id: selectedElection,
      user_id: userId,
      granted_at: new Date().toISOString(),
    });

    if (error) {
      setError(error.message);
    } else {
      setGrantedUserIds((prev) => [...prev, userId]);
    }
  };

  if (loading || !user) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-blue-50 space-y-6 text-blue-700">
      <h1 className="text-2xl font-bold">Give Right to Vote</h1>

      {error && <p className="text-red-600">{error}</p>}

      {/* Election Selector */}
      <select
        className="p-2 rounded-md border"
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

      {selectedElection && (
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
          <h2 className="text-lg font-semibold text-blue-600">
            Approved Users
          </h2>

          {loadingRights ? (
            <p className="text-gray-500">Loading voting rights...</p>
          ) : (
            <table className="min-w-full table-auto text-sm text-left">
              <thead className="bg-blue-100 text-blue-700 font-semibold">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Student ID</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Wallet Address</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.map((user) => (
                  <tr key={user.id} className="border-t border-gray-200">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.student_id}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.wallet_address}</td>
                    <td className="px-4 py-2">
                      {grantedUserIds.includes(user.id) ? (
                        <span className="text-green-600 font-medium">
                          Granted
                        </span>
                      ) : (
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => handleGrantRight(user.id)}
                        >
                          Give Right
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
