import { useMemo, useState } from "react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard, ProjectCardSkeleton } from "./ProjectCard";
import { ArrowRight, Info, Search, SlidersHorizontal } from "lucide-react";
import { Project } from "@/types";

type SortMode = "popular" | "newest" | "name";

function normalizeProject(project: Project) {
  return {
    ...project,
    category: project.category || "Project",
    netScore: project.netScore ?? 0,
    createdAt: project.createdAt || "",
  };
}

export function ProjectGrid() {
  const { data: projects, isLoading, isError } = useProjects();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("popular");

  const normalizedProjects = useMemo(() => (projects || []).map(normalizeProject), [projects]);

  const categories = useMemo(() => {
    const values = new Set(normalizedProjects.map((project) => project.category));
    return ["All", ...Array.from(values).sort()];
  }, [normalizedProjects]);

  const filteredProjects = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    const result = normalizedProjects.filter((project) => {
      const matchesCategory = category === "All" || project.category === category;
      const haystack = [project.name, project.description, project.category, ...(project.tags || [])]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !lowerQuery || haystack.includes(lowerQuery);
      return matchesCategory && matchesQuery;
    });

    result.sort((a, b) => {
      if (sortMode === "name") {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }

      return (b.netScore || 0) - (a.netScore || 0);
    });

    return result;
  }, [category, normalizedProjects, query, sortMode]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <div className="mb-14 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Explorer Directory</p>
          <h2 className="mt-5 text-4xl font-black leading-[1.02] text-[var(--text-primary)] sm:text-5xl">
            Approved Seismic projects, arranged for discovery.
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
          This is the core explorer for Seismic testnet projects. Use search and category filters to move faster, then open a project page for the full context before launching.
        </p>
      </div>

      <div className="glass-card mb-8 grid gap-4 p-5 lg:grid-cols-[1.2fr_0.9fr_0.7fr] lg:items-center">
        <label className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, categories, or tags"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </label>

        <div className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3">
          <SlidersHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none"
          >
            {categories.map((option) => (
              <option key={option} value={option} className="bg-[#151214] text-[var(--text-primary)]">
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-[1.25rem] border border-[var(--border-light)] bg-white/[0.03] p-1">
          {[
            { label: "Popular", value: "popular" as const },
            { label: "Newest", value: "newest" as const },
            { label: "A-Z", value: "name" as const },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortMode(option.value)}
              className={`flex-1 rounded-[1rem] px-3 py-2 text-xs font-semibold transition-all ${
                sortMode === option.value
                  ? "bg-[var(--accent)] text-[#090807]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && !isError && normalizedProjects.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="signal-badge">{filteredProjects.length} shown</span>
          <span className="signal-badge">{normalizedProjects.length} total</span>
          {category !== "All" && <span className="signal-badge">Category: {category}</span>}
          {query && <span className="signal-badge">Search: {query}</span>}
        </div>
      )}

      {isError && (
        <div className="glass-card py-16 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">The explorer could not sync with the backend.</p>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Make sure the Seismic Signal API is running, then refresh the page.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => <ProjectCardSkeleton key={index} />)
          : filteredProjects.length > 0
            ? filteredProjects.map((project) => <ProjectCard key={project.id} project={project} />)
            : !isError && normalizedProjects.length > 0
              ? (
                <div className="glass-card col-span-full border-dashed p-20 text-center">
                  <Info className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
                  <p className="text-lg font-semibold text-[var(--text-primary)]">No projects match those filters yet.</p>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">Try a different search, switch categories, or reset to the full directory.</p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setCategory("All");
                      setSortMode("popular");
                    }}
                    className="btn-primary mt-8 inline-flex items-center gap-2"
                  >
                    Reset explorer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )
              : !isError && (
                <div className="glass-card col-span-full border-dashed p-20 text-center">
                  <Info className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
                  <p className="text-lg font-semibold text-[var(--text-primary)]">There are no approved projects in the explorer yet.</p>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">You can start by opening the builder intake page.</p>
                  <Link href="/submit-project" className="btn-primary mt-8 inline-flex items-center gap-2">
                    Submit the first project
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
      </div>
    </section>
  );
}
