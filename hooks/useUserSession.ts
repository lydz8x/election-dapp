"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AppUser = {
  id: string;
  email: string;
  name: string;
  student_id: string;
  role: string;
  status: string;
  wallet_address?: string | null;
};

export default function useUserSession() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: authData, error } = await supabase.auth.getUser();

      if (error || !authData.user) {
        router.push("/login");
        setLoading(false);
        return;
      }

      const { data: fullUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError || !fullUser) {
        router.push("/login");
        setLoading(false);
        return;
      }

      setUser(fullUser);
      setLoading(false);
    };

    getSession();
  }, [router]);

  return { user, loading };
}
