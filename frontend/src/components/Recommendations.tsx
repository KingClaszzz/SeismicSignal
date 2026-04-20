import { useWallet } from "@/hooks/useWallet";
import { useRecommendations } from "@/hooks/useProjects";
import { ProjectCard, ProjectCardSkeleton } from "./ProjectCard";

export function Recommendations() {
  const { isConnected } = useWallet();
  const { data, isLoading } = useRecommendations(isConnected);

  if (!isConnected) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="glass-card interactive-panel overflow-hidden p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Curated Picks</p>
            <h2 className="mt-5 text-3xl font-black leading-[1.04] text-[var(--text-primary)] sm:text-4xl">
              Start with projects the explorer is already seeing real signal from.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">
              These cards surface approved Seismic listings that are worth opening next, so the product feels more like a guided
              discovery layer than a plain index.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <ProjectCardSkeleton key={index} />)
              : data?.map((project) => <ProjectCard key={project.id} project={project} variant="recommended" />)}
          </div>
        </div>
      </div>
    </section>
  );
}
