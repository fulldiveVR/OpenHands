import { useQuery } from "@tanstack/react-query";
import OpenHands from "#/api/open-hands";

// Modified to accept enabled parameter for conditional execution
export const useUserRepositories = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["repositories"],
    queryFn: OpenHands.retrieveUserGitRepositories,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    enabled: enabled, // Only execute the query if enabled is true
  });
