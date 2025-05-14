"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import { useState } from "react";
import {
  useAccount,
  useWalletClient,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { BadgeCard } from "@/components/BadgeCard";
import { Badge, badges } from "@/lib/badges";
import { injected } from "wagmi/connectors";
import { abi, contractAddress } from "@/contract";
import { monadTestnet } from "viem/chains";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spinner } from "@/components/Spinner";
import { BadgeModal } from "@/components/BadgeModal";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
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

  const { isFetching } = useQuery({
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
      if (!isConnected) {
        const result = await connectAsync({ connector: injected() });
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
        account: address ?? null,
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
      />

      <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
        <DialogContent className="text-center max-w-[90%] rounded-lg sm:max-w-sm">
          <p className="text-xl font-bold text-gray-900 mb-2">
            Connected Wallet
          </p>
          <p className="text-sm text-gray-800 mb-4">
            You&apos;re currently connected with{" "}
            <span className="font-mono">
              {address?.substring(0, 6)}...
              {address?.substring(address.length - 4)}
            </span>{" "}
            . If you&apos;d like to switch to a different wallet, please
            disconnect first.
          </p>
          <button
            onClick={() => {
              disconnect();
              setWalletModalOpen(false);
            }}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700"
          >
            Disconnect / Use Another Wallet
          </button>
        </DialogContent>
      </Dialog>

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
              {address ? (
                <button
                  onClick={() => setWalletModalOpen(true)}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {address.substring(0, 6)}...
                  {address.substring(address.length - 4)}
                </button>
              ) : (
                <button
                  onClick={() => connect({ connector: injected() })}
                  className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Connect Wallet
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
            <button className="flex items-center p-2 gap-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
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
