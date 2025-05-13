import { useMiniApp } from "@/contexts/miniapp-context";
import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { NeynarUser } from "@/lib/neynar";
import { sdk } from "@farcaster/frame-sdk";
import { useCallback, useEffect, useState } from "react";
import { useApiMutation } from "./use-api-mutation";
import { useApiQuery } from "./use-api-query";
import { useAuthCheck } from "./use-auth-check";
import { useSaveUserProfile } from "@/hooks/use-save-user-mutation";

export const useSignIn = ({ autoSignIn = false }: { autoSignIn?: boolean }) => {
  const { context } = useMiniApp();
  const { data: authCheck, isLoading: isCheckingAuth } = useAuthCheck();
  const { mutate: saveUserProfile } = useSaveUserProfile();
  const {
    data: user,
    isLoading: isLoadingNeynarUser,
    refetch: refetchUser,
  } = useApiQuery<NeynarUser>({
    url: "/api/users/me",
    method: "GET",
    isProtected: true,
    queryKey: ["user"],
    enabled: !!authCheck,
  });

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      saveUserProfile({
        ...user,
        monad_wallet: null,
        verified_wallet: false,
        badges: [],
      });
    }
  }, [user, saveUserProfile]);

  const { mutate: signIn, isPending } = useApiMutation<
    { user: NeynarUser },
    {
      signature: string;
      message: string;
      fid: number;
      referrerFid: number | null;
    }
  >({
    url: "/api/auth/sign-in",
    method: "POST",
    body: (variables) => variables,
    onSuccess: () => {
      setIsSignedIn(true);
    },
    onError: (err) => {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
    },
  });

  const handleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        throw new Error("No context found");
      }

      const result = await sdk.actions.signIn({
        nonce: Math.random().toString(36).substring(2),
        notBefore: new Date().toISOString(),
        expirationTime: new Date(
          Date.now() + MESSAGE_EXPIRATION_TIME
        ).toISOString(),
      });

      if (!result) {
        throw new Error("Sign in failed");
      }

      const referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.fid
          : null;

      await signIn({
        signature: result.signature,
        message: result.message,
        fid: context.user.fid,
        referrerFid,
      });

      refetchUser();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, signIn, authCheck, isCheckingAuth, refetchUser]);

  useEffect(() => {
    // if autoSignIn is true, sign in automatically on mount
    if (autoSignIn) {
      if (authCheck && !isCheckingAuth) {
        setIsSignedIn(true);
        refetchUser();
      } else if (!authCheck && !isCheckingAuth) {
        handleSignIn();
      }
    }
  }, [autoSignIn, handleSignIn, authCheck, isCheckingAuth, refetchUser]);

  return {
    signIn: handleSignIn,
    isSignedIn,
    isLoading: isLoading || isPending || isCheckingAuth,
    error,
    user,
  };
};
