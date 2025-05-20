"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useUserSession from "../../../../hooks/useUserSession";

type UserRow = {
  id: string;
  name: string;
  email: string;
  student_id: string;
  role: string;
  status: string;
};

export default function AdminApprovalsPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [pendingUsers, setPendingUsers] = useState<UserRow[]>([]);
  const [refresh, setRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, student_id, role, status")
      .eq("status", "pending");

    if (error) {
      setError(error.message);
    } else {
      setPendingUsers(data);
    }
  };

  const updateUserStatus = async (
    id: string,
    status: "approved" | "flagged"
  ) => {
    const { error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setRefresh(!refresh);
    } else {
      alert("Failed to update user:" + error.message);
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/user");
    }
    fetchPendingUsers();
  }, [refresh, user, loading, router]);

  if (loading || !user) return <p className="p-4">Loading...</p>;
  return (
    <div className="min-h-screen p-6 bg-blue-50">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        Pending Approvals
      </h1>

      {error && <p className="text-red-600">{error}</p>}

      {pendingUsers.length === 0 ? (
        <p className="text-blue-600">No users waiting for approval.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow bg-white text-blue-700">
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-blue-100 font-semibold">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.student_id}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">{u.role}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      className="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700"
                      onClick={() => updateUserStatus(u.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
                      onClick={() => updateUserStatus(u.id, "flagged")}
                    >
                      Flag
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
