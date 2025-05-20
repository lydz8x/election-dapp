"use client";

// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import LogoutButton from "../../../components/LogoutButton";
import { Home, User, Users, CheckCircle, BarChart2 } from "lucide-react";
import { usePathname } from "next/navigation";
import ConnectWalletButton from "../../../components/ConnectWalletButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
    {
      href: "/admin/users",
      label: "User List",
      icon: <User className="w-4 h-4" />,
    },
    {
      href: "/admin/approvals",
      label: "User Approvals",
      icon: <Users className="w-4 h-4" />,
    },
    {
      href: "/admin/rights",
      label: "Voting Rights",
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      href: "/admin/results",
      label: "Results",
      icon: <BarChart2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-blue-900 text-white p-6 space-y-4 shadow-md">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-3 text-sm">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded ${
                pathname === item.href
                  ? "bg-blue-700 text-white"
                  : "hover:text-blue-300"
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-50 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <ConnectWalletButton />
            <LogoutButton />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
