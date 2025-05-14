"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import { useState } from "react";
import { useAccount, useWalletClient, useConnect, useSwitchChain } from "wagmi";
import { farcasterFrame as miniAppConnector } from "@farcaster/frame-wagmi-connector";
import { waitForTransactionReceipt } from "wagmi/actions";
import { BadgeCard } from "@/components/BadgeCard";
import { Badge, badges } from "@/lib/badges";
import { abi, contractAddress } from "@/contract";
import { monadTestnet } from "viem/chains";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "@/components/Spinner";
import { BadgeModal } from "@/components/BadgeModal";
import Image from "next/image";
import { RefreshCw } from "lucide-react";
import { WalletClient } from "viem";
import { config } from "@/contexts/frame-wallet-context";

export const Home: React.FC = () => {
  const { isSignedIn, user } = useSignIn({
    autoSignIn: true,
  });
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [mintedBadges, setMintedBadges] = useState<number[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();

  const { mutateAsync: fetchUser } = useMutation({
    mutationKey: ["userProfile", user?.fid],
    mutationFn: async () => {
      const res = await fetch(`/api/user/${user?.fid}`);

      return res.json();
    },
    onSuccess: (data) => {
      setMintedBadges(data.badges ?? []);
    },
  });

  const { isFetching, refetch: refetchBadges } = useQuery({
    queryKey: ["availableBadges", address, user?.fid],
    queryFn: async () => {
      if (!address || !user?.fid) return [];
      const res = await fetch("/api/badges/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: address, fid: user.fid, user: user }),
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableBadges(data);
        await fetchUser();
      }

      return data.map((b: any) => b.id);
    },
    enabled: !!address && !!user?.fid,
  });

  const { data: walletClient } = useWalletClient({
    chainId: monadTestnet.id,
  }) as { data: WalletClient | undefined };

  const mintBadge = async (badgeId: number, tokenURI: string) => {
    try {
      setIsMinting(true);

      if (!isConnected) {
        const result = await connectAsync({ connector: miniAppConnector() });
        if (!result?.accounts?.length) {
          throw new Error("Wallet connection failed");
        }
      }

      if (!walletClient) {
        console.log("No wallet client available");
        toast.error("No wallet client available");
        return;
      }

      const currentChainId = await walletClient.getChainId?.();
      if (currentChainId !== monadTestnet.id) {
        await switchChainAsync({ chainId: monadTestnet.id });
      }

      const response = await fetch("/api/badges/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, badgeId, tokenURI }),
      });

      const { signature } = await response.json();

      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi,
        functionName: "mintBadge",
        args: [badgeId, tokenURI, signature],
        account: walletClient.account?.address ?? null,
        chain: monadTestnet,
      });

      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        chainId: monadTestnet.id,
      });

      if (receipt.status !== "success") {
        throw new Error("Transaction failed");
      }

      await fetch("/api/badges/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: user?.fid, badgeId }),
      });

      setMintedBadges((prev) => [...prev, badgeId]);
      toast.success(`Badge minted sucessfully! Tx hash: ${txHash}`);
      console.log(`Badge minted! Tx hash: ${txHash}`);
    } catch (err) {
      console.error("Mint error", err);
      console.log(
        "Mint failed: " + (err instanceof Error ? err.message : "Unknown")
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
      <BadgeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        badge={selectedBadge}
        isAvailable={availableBadges.some((b) => b.id === selectedBadge?.id)}
        isMinted={
          selectedBadge ? mintedBadges.includes(selectedBadge.id) : false
        }
        onClick={() => {
          if (selectedBadge)
            mintBadge(selectedBadge.id, selectedBadge.tokenURI);
        }}
        isMinting={isMinting}
      />

      <div className="bg-white text-black min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-10">
            <Image
              src="/images/banner.png"
              alt="Proof of Nad Banner"
              width={1000}
              height={200}
              className="w-full h-auto rounded-lg shadow-md object-contain"
              priority
            />
            <div className="absolute top-4 right-4 flex items-center space-x-4">
              {walletClient?.account && (
                <button className="cursor-default px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                  {walletClient?.account.address.substring(0, 6)}...
                  {walletClient?.account.address.substring(
                    walletClient?.account.address.length - 4
                  )}
                </button>
              )}
              {user?.pfp_url && (
                <Image
                  src={user.pfp_url}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full border border-gray-300"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end pr-4 mb-4 ">
            <button
              className="flex items-center p-2 gap-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              onClick={() => refetchBadges()}
            >
              Refresh Badges <RefreshCw className="text-white" />
            </button>
          </div>

          {isFetching ? (
            <div className="flex justify-center items-center">
              <Spinner />
            </div>
          ) : (
            isSignedIn && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isAvailable={availableBadges.some((b) => b.id === badge.id)}
                    isMinted={mintedBadges.includes(badge.id)}
                    onClick={() => {
                      setSelectedBadge(badge);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};
