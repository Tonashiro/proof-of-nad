import { UserProfile } from "@/lib/types";
import { useApiMutation } from "./use-api-mutation";

export const useSaveUserProfile = () =>
  useApiMutation<null, UserProfile>({
    url: "/api/user/save",
    method: "POST",
    body: (user) => user,
    onError: (err) => {
      console.error("Failed to save user to Redis", err);
    },
  });
