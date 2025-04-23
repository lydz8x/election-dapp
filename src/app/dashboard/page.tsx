"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useUserSession from "../../../hooks/useUserSession";
import Image from "next/image";

type Election = {
  id: string;
  title: string;
  duration: number;
  created_at: string;
};

type Candidate = {
  id: string;
  election_id: string;
  name: string;
  vision: string;
  mission: string;
  image_url: string;
};

export default function DashboardPage() {
  const { user, loading } = useUserSession();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("status")
        .eq("id", user.id)
        .single();

      if (!error && data) setStatus(data.status);
    };

    const fetchEelections = async () => {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setElections(data);
    };

    const fetchCandidates = async () => {
      const { data, error } = await supabase.from("candidates").select("*");

      if (!error && data) setCandidates(data);
    };

    fetchStatus();
    fetchEelections();
    fetchCandidates();
  }, [user]);

  if (loading || !user) return <p className="p-4">Loading...</p>;

  if (status !== "approved") {
    return (
      <div className="min-h-screen p-6 bg-blue-50">
        <div className="bg-white p-6 rounded-xl shadow max-w-xl mx-auto text-center">
          <h1 className="text-xl font-semibold text-blue-700 mb-2">
            Awaiting Approval
          </h1>
          <p className="text-blue-600">
            Your account is pending admin approval. You’ll be able to vote once
            approved.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen p-6 bg-blue-50">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        Available Elections
      </h1>

      {elections.length === 0 ? (
        <p className="text-blue-600">No elections available.</p>
      ) : (
        <div className="space-y-8">
          {elections.map((election) => (
            <div key={election.id} className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-blue-600 mb-4">
                {election.title}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {candidates
                  .filter((c) => c.election_id === election.id)
                  .map((candidate) => (
                    <div
                      key={candidate.id}
                      className="border rounded-lg p-4 space-y-2 bg-blue-50"
                    >
                      <Image
                        src={candidate.image_url}
                        alt={candidate.name}
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <h3 className="text-lg font-semibold">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-blue-700">
                        <strong>Vision:</strong> {candidate.vision}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Mission:</strong> {candidate.mission}
                      </p>
                      <button
                        disabled
                        className="mt-2 w-full px-3 py-2 rounded-md bg-gray-300 text-gray-600 cursor-not-allowed"
                      >
                        Vote (Coming soon)
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
