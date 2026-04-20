import { ApiResponse, Project } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { 
    next: { revalidate: 60 },
    credentials: 'include'
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  getProjects: () => get<Project[]>("/api/projects?status=APPROVED"),
  getProject: (id: string) => get<Project>(`/api/projects/${id}`),
  getFeatured: () => get<Project[]>("/api/projects/featured"),
  getRecommendations: (count = 3) =>
    get<Project[]>(`/api/projects/recommend?count=${count}`),
};
