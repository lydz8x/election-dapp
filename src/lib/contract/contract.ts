export const CONTRACT_ADDRESS = "0x0df8320f97cEdB85Bf35F3Ab155DBAf6D7239750";

export const CONTRACT_ABI = [
  [
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "title",
          type: "bytes32",
        },
        {
          internalType: "bytes32[]",
          name: "proposalNames",
          type: "bytes32[]",
        },
        {
          internalType: "uint256",
          name: "duration",
          type: "uint256",
        },
      ],
      name: "createElection",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "bytes32",
          name: "title",
          type: "bytes32",
        },
      ],
      name: "ElectionCreated",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "voter",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "weight",
          type: "uint256",
        },
      ],
      name: "giveRightToVote",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "newProposal",
          type: "uint256",
        },
      ],
      name: "updateVote",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "proposal",
          type: "uint256",
        },
      ],
      name: "vote",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "voter",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "proposalIndex",
          type: "uint256",
        },
      ],
      name: "VoteCast",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "voter",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "newProposalIndex",
          type: "uint256",
        },
      ],
      name: "VoteUpdated",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "address",
          name: "voter",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "weight",
          type: "uint256",
        },
      ],
      name: "VoterAuthenticated",
      type: "event",
    },
    {
      inputs: [],
      name: "chairperson",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      name: "elections",
      outputs: [
        {
          internalType: "bytes32",
          name: "title",
          type: "bytes32",
        },
        {
          internalType: "uint256",
          name: "votingDeadline",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "currentWinner",
          type: "uint256",
        },
        {
          internalType: "bool",
          name: "exists",
          type: "bool",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
      ],
      name: "timeLeft",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
      ],
      name: "winningName",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "electionIndex",
          type: "uint256",
        },
      ],
      name: "winningProposal",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ],
];
