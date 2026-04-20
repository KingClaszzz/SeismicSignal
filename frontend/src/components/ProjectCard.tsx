import Image from "next/image";
import Link from "next/link";
import { Project } from "@/types";
import { motion } from "framer-motion";
import { ExternalLink, Eye } from "lucide-react";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { BrandMark } from "./BrandMark";

const CATEGORY_COLORS: Record<string, string> = {
  DEX: "text-[var(--signal-gold)] bg-[rgba(166,146,77,0.12)] border-[rgba(166,146,77,0.22)]",
  Bridge: "text-[var(--accent)] bg-[rgba(209,204,191,0.08)] border-[rgba(209,204,191,0.16)]",
  Tools: "text-[var(--signal-plum)] bg-[rgba(130,90,109,0.14)] border-[rgba(130,90,109,0.24)]",
  NFT: "text-[#d0acb8] bg-[rgba(130,90,109,0.12)] border-[rgba(130,90,109,0.18)]",
  DeFi: "text-[var(--accent)] bg-[rgba(82,53,66,0.22)] border-[rgba(209,204,191,0.14)]",
  Infrastructure: "text-[var(--text-primary)] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]",
  Project: "text-[var(--text-secondary)] bg-white/[0.04] border-[var(--border-light)]",
};

interface Props {
  project: Project;
  variant?: "default" | "recommended";
}

function ProjectThumb({ project }: { project: Project }) {
  if (project.imageUrl) {
    return (
      <Image
        src={project.imageUrl}
        alt={project.name}
        width={56}
        height={56}
        unoptimized
        className="h-full w-full object-cover"
      />
    );
  }

  return <BrandMark className="h-full w-full rounded-[1.25rem]" />;
}

export function ProjectCard({ project, variant = "default" }: Props) {
  const [isVisited, setIsVisited] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const visitData = localStorage.getItem(`visit_${project.id}`);
    setIsVisited(visitData === today);
  }, [project.id]);

  const handleVisit = () => {
    localStorage.setItem(`visit_${project.id}`, new Date().toDateString());
    setIsVisited(true);
  };

  const category = project.category || "Project";
  const catClass = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Project;
  const projectUrl = project.websiteUrl || project.url || "#";
  const projectHref = `/projects/${project.id}`;
  const summary = useMemo(() => project.description.trim(), [project.description]);
  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{
        y: -10,
        transition: { duration: 0.2, ease: "easeOut" },
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      }}
      onMouseMove={handlePointerMove}
      className="project-glass-card interactive-panel group relative flex h-full flex-col gap-6 overflow-hidden p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--pointer-x,50%)_var(--pointer-y,20%),rgba(209,204,191,0.16),transparent_34%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-[rgba(130,90,109,0.2)] blur-[80px] transition-transform duration-500 group-hover:scale-125" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.055] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <ProjectThumb project={project} />
        </div>

        <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${catClass}`}>
          {category}
        </div>
      </div>

      <div className="relative flex-1">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">{project.name}</h3>
          <Link
            href={projectHref}
            className="rounded-full border border-white/10 bg-white/[0.055] p-2.5 text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all hover:border-[rgba(209,204,191,0.24)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]"
            title="View project details"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        <p className="line-clamp-4 text-sm leading-7 text-[var(--text-secondary)]">{summary}</p>
      </div>

      <div className="relative flex items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
        <span>{isVisited ? "Opened today" : "Not opened today"}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--signal-gold)]" />
      </div>

      <div className="relative grid gap-3">
        <Link
          href={projectHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-[rgba(209,204,191,0.26)] hover:bg-white/[0.075]"
        >
          View details
          <Eye className="h-4 w-4" />
        </Link>

        <a
          href={projectUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleVisit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(209,204,191,0.18)] bg-[rgba(209,204,191,0.08)] py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-all hover:bg-[var(--accent)] hover:text-[#090807]"
        >
          {variant === "recommended" ? "Launch dApp" : "Open project"}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass-card flex animate-pulse flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div className="h-14 w-14 rounded-[1.25rem] bg-white/[0.04]" />
        <div className="h-6 w-20 rounded-full bg-white/[0.04]" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-36 rounded bg-white/[0.04]" />
        <div className="h-3 w-full rounded bg-white/[0.04]" />
        <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
        <div className="h-3 w-3/5 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-3">
        <div className="h-11 rounded-full bg-white/[0.04]" />
        <div className="h-11 rounded-full bg-white/[0.04]" />
      </div>
    </div>
  );
}
