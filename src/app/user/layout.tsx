"use client";

// app/user/layout.tsx
import ConnectWalletButton from "../../../components/ConnectWalletButton";
import LogoutButton from "../../../components/LogoutButton";
import Link from "next/link";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-blue-50">
      <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-blue-700">User Dashboard</h1>
        <div className="flex items-center gap-4">
          <ConnectWalletButton />
          <LogoutButton />
        </div>
      </header>

      <nav className="bg-white border-b shadow px-6 py-2 flex gap-4 text-blue-600 font-medium">
        <Link href="/user" className="hover:underline">
          Vote
        </Link>
        <Link href="/user/results" className="hover:underline">
          Results
        </Link>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  );
}
