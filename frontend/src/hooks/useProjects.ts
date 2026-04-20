"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    staleTime: 60_000,
  });
}

export function useRecommendations(enabled: boolean) {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.getRecommendations(3),
    enabled,
    staleTime: 30_000,
  });
}
