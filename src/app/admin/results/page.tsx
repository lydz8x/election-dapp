"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import useUserSession from "../../../../hooks/useUserSession";
import { useRouter } from "next/navigation";

interface Election {
  id: string;
  title: string;
}

interface Candidate {
  id: string;
  name: string;
}

interface Vote {
  election_id: string;
  proposal_index: number;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/user");
      return;
    }

    if (!user || user.role !== "admin") return;

    const fetchResults = async () => {
      const { data: electionsData } = await supabase
        .from("elections")
        .select("id, title");

      setElections((electionsData as Election[]) || []);

      const candidateMap: Record<string, Candidate[]> = {};
      for (const election of (electionsData as Election[]) || []) {
        const { data: candData } = await supabase
          .from("candidates")
          .select("id, name")
          .eq("election_id", election.id);

        candidateMap[election.id] = (candData as Candidate[]) || [];
      }
      setCandidates(candidateMap);

      const { data: allVotes } = await supabase
        .from("votes")
        .select("election_id, proposal_index");

      const countsMap: Record<string, number[]> = {};
      for (const election of (electionsData as Election[]) || []) {
        const countArray = new Array(
          candidateMap[election.id]?.length || 0
        ).fill(0);
        ((allVotes as Vote[]) || [])
          .filter((v) => v.election_id === election.id)
          .forEach((v) => {
            countArray[v.proposal_index]++;
          });
        countsMap[election.id] = countArray;
      }
      setVoteCounts(countsMap);
    };

    fetchResults();
  }, [user, loading, router]);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Admin Results</h1>

      {elections.map((election) => {
        const results = voteCounts[election.id] || [];
        const maxVotes = Math.max(...results);
        const electionCandidates = candidates[election.id] || [];

        return (
          <div
            key={election.id}
            className="mb-8 bg-white shadow p-4 rounded-xl"
          >
            <h2 className="text-xl font-semibold text-blue-600 mb-2">
              {election.title}
            </h2>
            <ul className="space-y-2 text-blue-700">
              {electionCandidates.map((cand, index) => (
                <li
                  key={cand.id}
                  className={`flex justify-between items-center p-3 rounded border ${
                    results[index] === maxVotes && maxVotes > 0
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="font-medium">{cand.name}</span>
                  <span className="text-sm text-gray-700">
                    {results[index]} vote{results[index] !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
