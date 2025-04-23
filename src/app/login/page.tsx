"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { email, password } = form;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Fetch the user role and status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      setError(userError.message);
      return;
    }

    if (userData.status !== "approved") {
      setError("Your account is not approved yet.");
      return;
    }

    // Redirect based on role
    if (userData.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/user");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Login</h1>
          <p className="text-blue-500 text-sm">Access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border border-blue-300 font-semibold rounded-xl text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-500"
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-3 border border-blue-300 font-semibold rounded-xl text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-500"
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
            Login
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
