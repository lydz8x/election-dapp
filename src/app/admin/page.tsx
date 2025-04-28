"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useUserSession from "../../../hooks/useUserSession";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { useWriteContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/lib/contract/contract";
import { ethers } from "ethers";

type Candidate = {
  name: string;
  vision: string;
  mission: string;
  imageFile: File | null;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useUserSession();
  const { writeContract, isPending, isSuccess, error } = useWriteContract();
  const [title, setTitle] = useState("");

  const [candidates, setCandidates] = useState<Candidate[]>([
    { name: "", vision: "", mission: "", imageFile: null },
  ]);

  const [duration, setDuration] = useState(60 * 60);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/user");
    }
  }, [user, loading, router]);

  if (loading || !user) return <p>Loading...</p>;

  const handleAddCandidate = () => {
    setCandidates([
      ...candidates,
      { name: "", vision: "", mission: "", imageFile: null },
    ]);
  };

  const handleCandidateChange = (
    index: number,
    field: keyof Candidate,
    value: string | File | null
  ) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], [field]: value };
    setCandidates(updated);
  };

  const handleCreateElection = async () => {
    if (!title || candidates.some((c) => !c.name)) {
      alert("Please fill in all candidate names and election title.");
      return;
    }

    try {
      // Step 1: Prepare bytes32 for blockchain
      const titleBytes32 = ethers.encodeBytes32String(title);
      const candidatesBytes32 = candidates.map((c) =>
        ethers.encodeBytes32String(c.name)
      );

      // Step 2: Call smart contract to create election
      const txHash = await writeContract({
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS,
        functionName: "createElection",
        args: [titleBytes32, candidatesBytes32, duration],
      });

      console.log("Transaction hash:", txHash);
      alert(`Transaction sent!\n\nHash:\n${txHash}`);

      // Show Etherscan link (optional: can also show in page later)
      console.log(
        `View transaction: https://sepolia.etherscan.io/tx/${txHash}`
      );

      // 🧠 wagmi v2: writeContract returns tx hash, not receipt.
      // Let's wait 10 seconds for confirmation (simple delay).
      await new Promise((resolve) => setTimeout(resolve, 10000));

      alert("Transaction likely confirmed! Now uploading profiles...");

      // Step 3: After blockchain confirmed, upload images and insert into Supabase
      for (const candidate of candidates) {
        let image_url = null;

        if (candidate.imageFile) {
          const fileExt = candidate.imageFile.name.split(".").pop();
          const filePath = `${uuidv4()}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("candidates")
              .upload(filePath, candidate.imageFile);

          if (uploadError) {
            console.error("Upload failed for:", candidate.name, uploadError);
            alert(`Failed to upload image for ${candidate.name}`);
            return;
          }

          console.log("Image uploaded at path:", uploadData?.path);

          image_url = supabase.storage.from("candidates").getPublicUrl(filePath)
            .data.publicUrl;
        }

        const { error: candidateError } = await supabase
          .from("candidates")
          .insert({
            election_title: title,
            name: candidate.name,
            vision: candidate.vision,
            mission: candidate.mission,
            profile_image_url: image_url,
          });

        if (candidateError) {
          console.error(
            "Failed to insert candidate into Supabase:",
            candidateError
          );
          alert(`Failed to save candidate ${candidate.name} to database`);
          return;
        }
      }

      alert("Election created successfully! 🚀");

      // Reset form
      setTitle("");
      setCandidates([{ name: "", vision: "", mission: "", imageFile: null }]);
      setDuration(60 * 60);
    } catch (err) {
      console.error("Create election failed:", err);
      alert("Failed to create election on chain.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-blue-700">
        Create New Election
      </h2>

      <div className="bg-white rounded-xl shadow p-6 space-y-4 w-full max-w-4xl mx-auto text-blue-600">
        {/* Title input */}
        <input
          type="text"
          placeholder="Election title"
          className="w-full p-2 border rounded-md"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Candidates form */}
        {candidates.map((candidate, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-2 bg-blue-50">
            <input
              type="text"
              placeholder={`Candidate ${idx + 1} name`}
              className="w-full p-2 border rounded-md"
              value={candidate.name}
              onChange={(e) =>
                handleCandidateChange(idx, "name", e.target.value)
              }
            />
            <textarea
              placeholder="Vision"
              className="w-full p-2 border rounded-md"
              value={candidate.vision}
              onChange={(e) =>
                handleCandidateChange(idx, "vision", e.target.value)
              }
            />
            <textarea
              placeholder="Mission"
              className="w-full p-2 border rounded-md"
              value={candidate.mission}
              onChange={(e) =>
                handleCandidateChange(idx, "mission", e.target.value)
              }
            />
            {/* Profile image preview */}
            {/* Image preview */}
            {candidate.imageFile && (
              <Image
                src={URL.createObjectURL(candidate.imageFile)}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-full border shadow mb-2"
              />
            )}

            <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700">
              Upload Profile Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleCandidateChange(
                    idx,
                    "imageFile",
                    e.target.files ? e.target.files[0] : null
                  )
                }
                className="hidden"
              />
            </label>
          </div>
        ))}

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={handleAddCandidate}
        >
          + Add Candidate
        </button>

        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (in hours)
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-md"
            value={duration / (60 * 60)}
            onChange={(e) => setDuration(Number(e.target.value) * 60 * 60)}
            min={1}
          />
        </div>

        <button
          onClick={handleCreateElection}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full"
        >
          Create Election
        </button>
        <div className="text-sm text-center mt-4">
          {isPending && (
            <p className="text-blue-500">Transaction is pending...</p>
          )}
          {isSuccess && (
            <p className="text-green-600">Election created successfully!</p>
          )}
          {error && (
            <p className="text-red-600">
              Something went wrong during transaction.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
