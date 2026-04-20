"use client";

import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ArrowLeft, ChevronDown, ChevronUp, Lock, Trophy, TriangleAlert } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

type GovernanceProject = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  websiteUrl: string;
  netScore: number;
  upvotes: number;
  downvotes: number;
};

export default function GovernancePage() {
  const { isLoggedIn, isConnected, prepareForConnect } = useWallet();
  const mounted = useIsMounted();
  const { open } = useWeb3Modal();
  const [projects, setProjects] = useState<GovernanceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api`;

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/projects?status=APPROVED`);
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isConnected) {
      fetchProjects();
    }
  }, [isConnected, fetchProjects]);

  const handleVote = async (projectId: string, isUpvote: boolean) => {
    if (!isLoggedIn) {
      alert("Connect and sign in first to vote.");
      return;
    }

    try {
      setVotingId(projectId);
      const res = await axios.post(`${API_URL}/projects/${projectId}/vote`, { isUpvote }, { withCredentials: true });

      if (res.data?.status === "DELETED") {
        alert("This project hit the removal threshold and was removed from the explorer.");
      }

      await fetchProjects();
    } catch (error: any) {
      alert(error.response?.data?.message || "Voting failed.");
    } finally {
      setVotingId(null);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card relative w-full max-w-xl overflow-hidden p-6 md:p-10"
        >
          <div className="mb-8 flex items-center gap-4">
            <BrandMark className="h-16 w-16 rounded-[1.5rem]" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Signal Ranking</p>
              <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Seismic Governance</h1>
            </div>
          </div>

          <p className="mb-10 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
            Governance here is used to rank Seismic projects that have already been approved by the admin. Upvotes are unlimited, and a
            project is removed from the explorer if its net score drops to `-10`.
          </p>

          <div className="mb-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Upvote</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Used to push strong projects higher in the ranking.</p>
            </div>
            <div className="rounded-[1.75rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Downvote</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">If the net score reaches `-10`, the project is removed from the directory.</p>
            </div>
          </div>

          <button
            onClick={() => {
              prepareForConnect();
              open();
            }}
            className="btn-primary w-full"
          >
            <span className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Connect Wallet
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-12">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <a
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to explorer
        </a>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="glass-card overflow-hidden p-8 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Governance Board</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] text-[var(--text-primary)] sm:text-5xl">
              Community ranking for the projects already listed in the Seismic explorer.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              This is not the builder submission page. Every project here has already passed admin review, and the community helps sort
              which ones deserve the most attention.
            </p>
          </section>

          <section className="grid gap-5">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-[1.25rem] bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Ranking Rule</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Upvotes are unlimited, so this board naturally highlights the projects with the strongest support.</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-[1.25rem] bg-[rgba(166,146,77,0.18)] p-3 text-[var(--signal-gold)]">
                  <TriangleAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Removal Rule</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">If a project falls to a net score of `-10`, it is removed from the explorer and no longer appears on the main directory.</p>
                </div>
              </div>
            </div>
            <a href="/submit-project" className="btn-secondary flex items-center justify-center text-sm">
              Submit Project for Admin Review
            </a>
          </section>
        </div>

        <section className="mt-10 space-y-6">
          {loading ? (
            <div className="space-y-5">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="glass-card h-40 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-card border-dashed p-20 text-center">
              <p className="text-lg font-semibold text-[var(--text-primary)]">There are no approved projects to rank yet.</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Builder submissions live on a separate page and stay pending until admin approval.</p>
            </div>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                className="glass-card flex flex-col gap-8 p-7 md:flex-row md:items-center md:justify-between md:p-8"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--border-light)] bg-white/[0.04]">
                    {project.imageUrl ? (
                      <Image src={project.imageUrl} alt={project.name} width={64} height={64} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <BrandMark className="h-full w-full rounded-[1.5rem]" />
                    )}
                  </div>

                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                        Rank {index + 1}
                      </span>
                      <span className="rounded-full border border-[rgba(166,146,77,0.24)] bg-[rgba(166,146,77,0.12)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--signal-gold)]">
                        Approved
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-black text-[var(--text-primary)]">{project.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{project.description}</p>
                    <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)] hover:underline">
                      Open project
                    </a>
                  </div>
                </div>

                <div className="flex min-w-[220px] items-center justify-between gap-5 rounded-[2rem] border border-[var(--border-light)] bg-[rgba(255,255,255,0.025)] px-5 py-4 md:justify-center">
                  <button
                    disabled={!!votingId}
                    onClick={() => handleVote(project.id, true)}
                    className={`flex h-12 w-12 items-center justify-center rounded-[1.2rem] transition-all ${
                      votingId === project.id
                        ? "opacity-50"
                        : "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-deep)]"
                    }`}
                  >
                    {votingId === project.id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                    ) : (
                      <ChevronUp className="h-5 w-5" />
                    )}
                  </button>

                  <div className="min-w-[72px] text-center">
                    <p className={`text-2xl font-black ${project.netScore > 0 ? "text-[var(--accent)]" : project.netScore < 0 ? "text-[#d98b8b]" : "text-[var(--text-primary)]"}`}>
                      {project.netScore > 0 ? `+${project.netScore}` : project.netScore}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Net Score</p>
                    <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
                      {project.upvotes} up · {project.downvotes} down
                    </p>
                  </div>

                  <button
                    disabled={!!votingId}
                    onClick={() => handleVote(project.id, false)}
                    className={`flex h-12 w-12 items-center justify-center rounded-[1.2rem] transition-all ${
                      votingId === project.id
                        ? "opacity-50"
                        : "bg-[rgba(130,90,109,0.14)] text-[var(--signal-plum)] hover:bg-[var(--signal-plum)] hover:text-[var(--bg-deep)]"
                    }`}
                  >
                    {votingId === project.id ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--signal-plum)] border-t-transparent" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </section>
      </motion.div>
    </div>
  );
}
