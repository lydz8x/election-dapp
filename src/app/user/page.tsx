"use client";

import { useEffect, useState } from "react";
import useUserSession from "../../../hooks/useUserSession";
import { supabase } from "@/lib/supabase";
import { useWriteContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract/contract";
import { getAccount, getPublicClient } from "wagmi/actions";
import { wagmiConfig } from "@/lib/wallet";

const formatCountdown = (seconds: number) => {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s left`;
};

type Election = {
  id: string;
  title: string;
  deadline: string;
  election_index: number;
};

type Candidate = {
  id: string;
  name: string;
  vision: string;
  mission: string;
};

export default function UserDashboard() {
  const { user, loading } = useUserSession();
  const { writeContractAsync } = useWriteContract();
  const { isConnected } = useAccount();

  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voteCounts, setVoteCounts] = useState<Record<string, number[]>>({});
  const [timeLeftMap, setTimeLeftMap] = useState<Record<number, number>>({});

  const [pendingVoteElectionId, setPendingVoteElectionId] = useState<
    string | null
  >(null);
  const [voteSuccessElectionId, setVoteSuccessElectionId] = useState<
    string | null
  >(null);
  const [voteErrorElectionId, setVoteErrorElectionId] = useState<string | null>(
    null
  );

  const publicClient = getPublicClient(wagmiConfig);
  const account = getAccount(wagmiConfig);

  const fetchTimeLefts = async (electionsData: Election[]) => {
    try {
      const updatedMap: Record<number, number> = {};
      for (const election of electionsData) {
        const secondsLeft = await publicClient.readContract({
          abi: CONTRACT_ABI,
          address: CONTRACT_ADDRESS,
          functionName: "timeLeft",
          args: [election.election_index],
          account: account.address,
        });
        updatedMap[election.election_index] = Number(secondsLeft);
      }
      setTimeLeftMap(updatedMap);
    } catch (error) {
      console.error("Error fetching time left from contract:", error);
    }
  };

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: rights } = await supabase
        .from("voting_rights")
        .select("election_id")
        .eq("user_id", user.id);

      const electionIds = rights?.map((r) => r.election_id) || [];

      const { data: electionsData } = await supabase
        .from("elections")
        .select("id, title, deadline, election_index")
        .in("id", electionIds);

      setElections(electionsData || []);

      const candidatesMap: Record<string, Candidate[]> = {};
      if (electionsData) {
        for (const election of electionsData) {
          const { data: candData } = await supabase
            .from("candidates")
            .select("id, name, vision, mission")
            .eq("election_id", election.id);

          candidatesMap[election.id] = candData || [];
        }
      }
      setCandidates(candidatesMap);

      const { data: votesData } = await supabase
        .from("votes")
        .select("election_id, proposal_index")
        .eq("voter_id", user.id);

      const votesMap: Record<string, number> = {};
      for (const vote of votesData || []) {
        votesMap[vote.election_id] = vote.proposal_index;
      }
      setVotes(votesMap);

      const { data: allVotes } = await supabase
        .from("votes")
        .select("election_id, proposal_index");

      const voteCountsMap: Record<string, number[]> = {};
      for (const election of electionsData || []) {
        const candidateCount = candidatesMap[election.id]?.length || 0;
        const counts = new Array(candidateCount).fill(0);

        allVotes
          ?.filter((v) => v.election_id === election.id)
          .forEach((v) => {
            counts[v.proposal_index]++;
          });

        voteCountsMap[election.id] = counts;
      }
      setVoteCounts(voteCountsMap);

      // fetch from smart contract
      await fetchTimeLefts(electionsData || []);
    } catch (err) {
      console.error("Error loading user dashboard:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (voteSuccessElectionId || voteErrorElectionId) {
      const timeout = setTimeout(() => {
        setVoteSuccessElectionId(null);
        setVoteErrorElectionId(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [voteSuccessElectionId, voteErrorElectionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeftMap((prev) => {
        const updated: Record<number, number> = {};
        for (const key in prev) {
          const idx = parseInt(key);
          updated[idx] = Math.max(0, prev[idx] - 1);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (electionId: string, proposalIndex: number) => {
    if (!user || !isConnected) {
      alert("Please connect your wallet.");
      return;
    }

    setPendingVoteElectionId(electionId);
    setVoteSuccessElectionId(null);
    setVoteErrorElectionId(null);

    try {
      const selectedElection = elections.find((e) => e.id === electionId);
      if (!selectedElection) {
        alert("Election not found.");
        return;
      }

      await writeContractAsync({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "vote",
        args: [selectedElection.election_index, proposalIndex],
      });

      setVoteSuccessElectionId(electionId);
      await fetchData();
    } catch (err) {
      console.error("Smart contract voting failed:", err);
      setVoteErrorElectionId(electionId);
    } finally {
      setPendingVoteElectionId(null);
    }
  };

  if (loading || !user) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-blue-50">
      <div className="flex justify-between items-center mt-3">
        <p className="font-semibold text-blue-600 mt-3">Welcome, {user.name}</p>
      </div>

      {elections.length === 0 ? (
        <p className="mt-4 text-gray-600">
          No elections available for you to vote in.
        </p>
      ) : (
        elections.map((election) => {
          const counts = voteCounts[election.id] || [];
          const maxVotes = Math.max(...counts);
          const secondsLeft = timeLeftMap[election.election_index] || 0;

          return (
            <div key={election.id} className="mt-8 text-blue-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold mb-2">{election.title}</h2>
                <span className="text-sm text-gray-500">
                  {formatCountdown(secondsLeft)}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {candidates[election.id]?.map((cand, index) => {
                  const alreadyVoted = votes[election.id] !== undefined;
                  const votedFor = votes[election.id] === index;
                  const isWinner = counts[index] === maxVotes && maxVotes > 0;

                  return (
                    <div
                      key={cand.id}
                      className={`p-4 border rounded-xl bg-white shadow relative ${
                        votedFor ? "border-blue-600" : ""
                      }`}
                    >
                      <h3 className="text-lg font-bold">{cand.name}</h3>
                      <p className="text-sm italic">Vision: {cand.vision}</p>
                      <p className="text-sm">Mission: {cand.mission}</p>

                      {isWinner && (
                        <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Leading
                        </span>
                      )}
                      <button
                        disabled={alreadyVoted || secondsLeft === 0}
                        className={`mt-3 px-4 py-2 rounded-md text-white ${
                          votedFor
                            ? "bg-blue-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                        onClick={() => handleVote(election.id, index)}
                      >
                        {votedFor
                          ? "Voted ✅"
                          : alreadyVoted
                          ? "Already Voted"
                          : "Vote"}
                      </button>
                    </div>
                  );
                })}
                <div className="col-span-full">
                  {pendingVoteElectionId === election.id && (
                    <p className="text-sm text-blue-500 mt-2">
                      Waiting for transaction confirmation...
                    </p>
                  )}
                  {voteSuccessElectionId === election.id && (
                    <p className="text-sm text-green-600 mt-2">
                      Vote successful! 🎉
                    </p>
                  )}
                  {voteErrorElectionId === election.id && (
                    <p className="text-sm text-red-600 mt-2">Vote failed. ❌</p>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
