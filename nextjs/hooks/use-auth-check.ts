import { useApiQuery } from "./use-api-query";

export const useAuthCheck = () => {
  return useApiQuery({
    url: "/api/auth/check",
    method: "GET",
    isProtected: true,
    queryKey: ["auth-check"],
  });
};
