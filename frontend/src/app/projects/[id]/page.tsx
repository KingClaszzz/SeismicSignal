"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandMark } from "@/components/BrandMark";
import { api } from "@/lib/api";
import { ArrowLeft, ExternalLink, ShieldCheck, Sparkles, Tags } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id || "";

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

  const meta = useMemo(() => {
    if (!project) return null;
    const category = project.category || "Project";
    const projectUrl = project.websiteUrl || project.url || "";
    const referenceUrl = project.forumUrl || "https://docs.seismic.systems/";
    const netScore = project.netScore ?? 0;

    return { category, projectUrl, referenceUrl, netScore };
  }, [project]);

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <Navbar />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-24 pt-36">
        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to explorer
        </Link>

        {isLoading ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="glass-card h-[280px] animate-pulse" />
            <div className="glass-card h-[280px] animate-pulse" />
          </div>
        ) : isError || !project || !meta ? (
          <div className="glass-card mt-8 p-16 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">Project not found.</p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">This listing may not be live in the explorer yet.</p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="glass-card overflow-hidden p-8">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border border-[var(--border-light)] bg-white/[0.03]">
                  {project.imageUrl ? (
                    <Image
                      src={project.imageUrl}
                      alt={project.name}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BrandMark className="h-full w-full rounded-[2rem]" />
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  <span className="signal-badge">{meta.category}</span>
                  <div className="rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Explorer Signal</p>
                    <p className={`mt-3 text-3xl font-black ${meta.netScore > 0 ? "text-[var(--accent)]" : meta.netScore < 0 ? "text-[#d98b8b]" : "text-[var(--text-primary)]"}`}>
                      {meta.netScore > 0 ? `+${meta.netScore}` : meta.netScore}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {project.upvotes ?? 0} upvotes · {project.downvotes ?? 0} downvotes
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Links</p>
                    <div className="mt-4 grid gap-3">
                      {meta.projectUrl && (
                        <a href={meta.projectUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--accent)] hover:underline">
                          Open project
                        </a>
                      )}
                      <a href={meta.referenceUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-primary)] hover:underline">
                        Open reference link
                      </a>
                      {project.twitterUrl && (
                        <a
                          href={project.twitterUrl.startsWith("http") ? project.twitterUrl : `https://x.com/${project.twitterUrl.replace("@", "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[var(--text-primary)] hover:underline"
                        >
                          Builder X
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 md:p-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Project Detail</p>
                <h1 className="mt-5 text-4xl font-black leading-[1.02] text-[var(--text-primary)] sm:text-5xl">{project.name}</h1>
                <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">{project.description}</p>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div className="rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-[var(--accent)]" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Why it matters</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                      This page gives users enough context to decide whether a project is worth opening before they leave the explorer.
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                    <div className="flex items-center gap-3">
                      <Tags className="h-5 w-5 text-[var(--signal-gold)]" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Reference</p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                      Docs, GitHub, product pages, or official threads should live here so people can verify context from the source.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-[1.8rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--accent)]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Explorer advisory</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                        Listings help discovery, but users should still verify contracts, risk, and privacy assumptions before interacting.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {meta.projectUrl && (
                    <a
                      href={meta.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                      Launch project
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <a
                    href={meta.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    Open reference
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
