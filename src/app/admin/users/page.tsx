"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useUserSession from "../../../../hooks/useUserSession";
import { useRouter } from "next/navigation";

interface AppUser {
  id: string;
  name: string;
  email: string;
  student_id: string;
  role: string;
  status: string;
  wallet_address: string | null;
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { user, loading } = useUserSession();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "flagged" | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
      return;
    }

    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, email, student_id, role, status, wallet_address");

      if (data) setUsers(data);
    };

    fetchUsers();
  }, [user, loading, router]);

  if (loading) return <p className="p-4">Loading...</p>;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "flagged":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedUser || !pendingAction) return;
    await supabase
      .from("users")
      .update({ status: pendingAction })
      .eq("id", selectedUser.id);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, status: pendingAction } : u
      )
    );
    setSelectedUser(null);
    setPendingAction(null);
  };

  const filteredUsers = filter
    ? users.filter((u) => u.status === filter)
    : users;
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">All Users</h1>

      <div className="flex items-center gap-3 mb-4 text-blue-600">
        <label className="text-sm font-medium">Filter by status:</label>
        <select
          className="border p-2 rounded text-sm"
          value={filter || ""}
          onChange={(e) => {
            setFilter(e.target.value || null);
            setCurrentPage(1);
          }}
        >
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded-md">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Student ID</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Wallet</th>
              {/* <th className="px-4 py-2 text-left">Actions</th> */}
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-blue-50 text-gray-700"
              >
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.student_id}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusStyle(
                      u.status
                    )}`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs break-all">
                  {u.wallet_address || "—"}
                </td>
                {/* <td className="px-4 py-2 space-x-2">
                  {u.status !== "approved" && (
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setPendingAction("approved");
                      }}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                  {u.status !== "flagged" && (
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setPendingAction("flagged");
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Flag
                    </button>
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded ${
              page === currentPage
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {selectedUser && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Confirm Action</h2>
            <p className="text-sm mb-4">
              Are you sure you want to set <strong>{selectedUser.name}</strong>{" "}
              to <strong>{pendingAction}</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
