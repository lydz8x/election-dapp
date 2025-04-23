"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    studentId: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { fullName, studentId, email, password } = form;

    // ✅ Sign up with Supabase Auth (no hashing!)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // ✅ Insert into `users` table (no password_hash)
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: data.user?.id,
        name: fullName,
        student_id: studentId,
        email: data.user?.email,
        role: "user",
        status: "pending",
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Register</h1>
          <p className="text-blue-500 text-sm">
            Join the university election platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-3 border border-blue-300 text-blue-400 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-400"
            name="fullName"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-3 border border-blue-300 rounded-xl text-blue-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-400"
            name="studentId"
            placeholder="Student ID"
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-3 border border-blue-300 rounded-xl text-blue-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-400"
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-3 border border-blue-300 rounded-xl text-blue-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-blue-400"
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition">
            Register
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
