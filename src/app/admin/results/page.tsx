"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import useUserSession from "../../../../hooks/useUserSession";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract/contract";
import { getAccount, getPublicClient } from "wagmi/actions";
import { ethers } from "ethers";
import { wagmiConfig } from "@/lib/wallet";

interface Election {
  id: string;
  title: string;
  election_index: number;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [proposalVotes, setProposalVotes] = useState<
    { name: string; votes: number }[]
  >([]);
  const publicClient = getPublicClient(wagmiConfig);
  const account = getAccount(wagmiConfig);

  useEffect(() => {
    if (!user) return;

    const fetchElections = async () => {
      const { data: electionsData } = await supabase
        .from("elections")
        .select("id, title, election_index");

      setElections((electionsData as Election[]) || []);
    };

    fetchElections();
  }, [user, loading, router]);

  // View result
  const handleViewResult = async () => {
    if (!selectedElection) return;

    try {
      const electionIndex = parseInt(selectedElection);

      const encoded = await publicClient.readContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "winningName",
        args: [electionIndex],
        account: account.address,
      });

      const decoded = ethers.decodeBytes32String(encoded as string);
      setWinnerName(decoded);

      // Vote count
      const [rawNames, rawVotes] = (await publicClient.readContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "getProposalVotes",
        args: [electionIndex],
        account: account.address,
      })) as [string[], bigint[]];

      const decodedProposalVotes = (rawNames as string[]).map((name, i) => ({
        name: ethers.decodeBytes32String(name),
        votes: Number((rawVotes as bigint[])[i]),
      }));

      setProposalVotes(decodedProposalVotes);
    } catch (err) {
      console.error("Failed to read winning name:", err);
      alert("Could not fetch winner from blockchain.");
    }
  };

  // Print result
  const handlePrintPDF = async () => {
    const element = document.getElementById("result-report");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(
      pageWidth / imgProps.width,
      pageHeight / imgProps.height
    );
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;

    pdf.addImage(
      imgData,
      "PNG",
      (pageWidth - imgWidth) / 2,
      40,
      imgWidth,
      imgHeight
    );
    pdf.save(`election-result-${selectedElection}.pdf`);
  };

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen p-6 bg-blue-50">
      <div className="p-6 min-h-screen bg-gray-50 text-blue-700">
        <h1 className="text-2xl font-bold mb-6">View Results</h1>

        <div className="space-y-4">
          <select
            className="p-2 rounded border w-full"
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
          >
            <option value="">Select an Election</option>
            {elections.map((e) => (
              <option key={e.id} value={e.election_index}>
                {e.title}
              </option>
            ))}
          </select>

          <button
            disabled={!selectedElection}
            onClick={handleViewResult}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Show Winner
          </button>

          {(winnerName || proposalVotes.length > 0) && (
            <div
              id="result-report"
              className="mt-6 bg-white p-6 rounded-xl shadow"
            >
              {winnerName && (
                <h2 className="text-xl font-semibold text-center text-green-700">
                  🏆 Winner: {winnerName}
                </h2>
              )}
              {proposalVotes.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">🗳️ Vote Counts</h3>
                  <ul className="space-y-2">
                    {proposalVotes.map((p, idx) => (
                      <li
                        key={idx}
                        className="bg-gray-100 p-3 rounded flex justify-between items-center"
                      >
                        <span>{p.name}</span>
                        <span className="font-bold">{p.votes} vote(s)</span>
                      </li>
                    ))}
                    <li className="mt-4 border-t pt-2 flex justify-between font-semibold text-blue-800">
                      <span>Total Votes</span>
                      <span>
                        {proposalVotes.reduce((acc, p) => acc + p.votes, 0)}{" "}
                        vote(s)
                      </span>
                    </li>
                  </ul>
                </div>
              )}
              <button
                onClick={handlePrintPDF}
                className="mt-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full"
              >
                📄 Print PDF Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
