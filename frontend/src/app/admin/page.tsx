"use client";

import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandMark } from "@/components/BrandMark";
import { useWallet } from "@/hooks/useWallet";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCheck, Clock3, Lock, PlusCircle, ShieldX, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AdminProject = {
  id: string;
  name: string;
  description: string;
  websiteUrl?: string | null;
  imageUrl?: string | null;
  forumUrl?: string | null;
  twitterUrl?: string | null;
  status: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  netScore: number;
};

type ManualProjectForm = {
  name: string;
  description: string;
  websiteUrl: string;
  forumUrl: string;
  twitterUrl: string;
  imageUrl: string;
  status: "APPROVED" | "PENDING";
};

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api`;

const emptyManualForm: ManualProjectForm = {
  name: "",
  description: "",
  websiteUrl: "",
  forumUrl: "",
  twitterUrl: "",
  imageUrl: "",
  status: "APPROVED",
};

export default function AdminPage() {
  const router = useRouter();
  const mounted = useIsMounted();
  const { isConnected, isLoggedIn, isAdmin, prepareForConnect } = useWallet();
  const { open } = useWeb3Modal();
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<ManualProjectForm>(emptyManualForm);
  const [creating, setCreating] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/projects/admin/submissions?status=${statusFilter}`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setProjects(res.data.data || []);
      }
    } catch (error: any) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isConnected && isLoggedIn && isAdmin) {
      fetchSubmissions();
    }
  }, [fetchSubmissions, isAdmin, isConnected, isLoggedIn]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (isConnected && isLoggedIn && !isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isConnected, isLoggedIn, mounted, router]);

  const handleStatusUpdate = async (projectId: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActingId(projectId);
      await axios.patch(
        `${API_URL}/projects/${projectId}/status`,
        { status },
        { withCredentials: true }
      );
      await fetchSubmissions();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update project status.");
    } finally {
      setActingId(null);
    }
  };

  const handleManualCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setCreating(true);
      await axios.post(`${API_URL}/projects/admin/projects`, manualForm, { withCredentials: true });
      const createdStatus = manualForm.status;
      setManualForm(emptyManualForm);
      if (statusFilter !== createdStatus) {
        setStatusFilter(createdStatus);
      } else {
        await fetchSubmissions();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add project manually.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    const confirmed = window.confirm(`Delete "${projectName}" from Seismic Signal? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setActingId(projectId);
      await axios.delete(`${API_URL}/projects/${projectId}`, { withCredentials: true });
      await fetchSubmissions();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete project.");
    } finally {
      setActingId(null);
    }
  };

  const statusPills = useMemo(
    () => [
      { label: "Pending", value: "PENDING" as const },
      { label: "Approved", value: "APPROVED" as const },
      { label: "Rejected", value: "REJECTED" as const },
    ],
    []
  );

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <main className="relative z-10">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 py-24">
          <div className="glass-card w-full max-w-xl p-8 md:p-10">
            <div className="mb-8 flex items-center gap-4">
              <BrandMark className="h-16 w-16 rounded-[1.5rem]" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Admin Access</p>
                <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Project Review Console</h1>
              </div>
            </div>

            <p className="mb-8 text-sm leading-7 text-[var(--text-secondary)]">
              Connect the admin wallet first to review submissions, approve listings, or reject projects before they appear in the explorer.
            </p>

            <button
              onClick={() => {
                prepareForConnect();
                open();
              }}
              className="btn-primary w-full"
            >
              <span className="inline-flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Connect Admin Wallet
              </span>
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (isConnected && isLoggedIn && !isAdmin) {
    return null;
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <main className="relative z-10">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center px-5 py-24">
          <div className="glass-card w-full max-w-2xl p-8 md:p-10">
            <div className="flex items-center gap-4">
              <div className="rounded-[1.5rem] bg-[rgba(130,90,109,0.16)] p-4 text-[var(--signal-plum)]">
                <ShieldX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Restricted</p>
                <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)]">This page is only visible to the admin wallet.</h1>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-[var(--text-secondary)]">
              Use the wallet address you assigned as admin. The backend still enforces this, so direct access will not bypass the restriction.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative z-10">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 pb-24 pt-36">
        <a
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to explorer
        </a>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="glass-card p-8 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Admin Review</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] text-[var(--text-primary)] sm:text-5xl">
              Review project submissions before they enter the Seismic explorer.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              This queue is only for your admin wallet. Builders submit from the public form, and you decide whether each project is approved, rejected, or kept pending.
            </p>
          </section>

          <section className="grid gap-5">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-[1.25rem] bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                  <CheckCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Approval Rule</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Only approved projects appear in the public explorer and governance ranking.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-[1.25rem] bg-[rgba(130,90,109,0.16)] p-3 text-[var(--signal-plum)]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Current Queue</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    Switch between pending, approved, and rejected submissions without leaving this page.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <form onSubmit={handleManualCreate} className="glass-card mt-10 overflow-hidden p-7 md:p-8">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Manual Listing</p>
              <h2 className="mt-3 text-2xl font-black text-[var(--text-primary)]">Add a project directly from admin.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Use this for trusted listings, official Seismic resources, or projects you already reviewed outside the public submission flow.
              </p>
            </div>
            <button disabled={creating} type="submit" className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
              <PlusCircle className="h-4 w-4" />
              {creating ? "Adding..." : "Add Project"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Project Name</span>
              <input
                required
                minLength={3}
                maxLength={100}
                value={manualForm.name}
                onChange={(event) => setManualForm((form) => ({ ...form, name: event.target.value }))}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="Seismic App"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Website URL</span>
              <input
                required
                value={manualForm.websiteUrl}
                onChange={(event) => setManualForm((form) => ({ ...form, websiteUrl: event.target.value }))}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="https://..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Reference Link</span>
              <input
                required
                value={manualForm.forumUrl}
                onChange={(event) => setManualForm((form) => ({ ...form, forumUrl: event.target.value }))}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="Docs, GitHub, X thread, or official page"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Builder X</span>
              <input
                required
                value={manualForm.twitterUrl}
                onChange={(event) => setManualForm((form) => ({ ...form, twitterUrl: event.target.value }))}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="@builder or https://x.com/builder"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Image URL</span>
              <input
                value={manualForm.imageUrl}
                onChange={(event) => setManualForm((form) => ({ ...form, imageUrl: event.target.value }))}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="Optional project logo URL"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Initial Status</span>
              <select
                value={manualForm.status}
                onChange={(event) => setManualForm((form) => ({ ...form, status: event.target.value as ManualProjectForm["status"] }))}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-[#151214] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Project Summary</span>
            <textarea
              required
              minLength={10}
              maxLength={1000}
              value={manualForm.description}
              onChange={(event) => setManualForm((form) => ({ ...form, description: event.target.value }))}
              className="h-28 w-full resize-none rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="What does this project do, and why should Seismic users care?"
            />
          </label>
        </form>

        <div className="mt-10 flex flex-wrap gap-3">
          {statusPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                statusFilter === pill.value
                  ? "bg-[var(--accent)] text-[#090807]"
                  : "border border-[var(--border-light)] bg-white/[0.03] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <section className="mt-8 space-y-5">
          {loading ? (
            [...Array(3)].map((_, index) => <div key={index} className="glass-card h-48 animate-pulse" />)
          ) : projects.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <p className="text-xl font-bold text-[var(--text-primary)]">No {statusFilter.toLowerCase()} submissions right now.</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                New builder submissions will appear here as soon as they are stored in the backend.
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-7 md:p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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
                        <span className="signal-badge">{project.status}</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                          Submitted {new Date(project.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="mt-4 text-2xl font-black text-[var(--text-primary)]">{project.name}</h2>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{project.description}</p>

                      <div className="mt-5 flex flex-wrap gap-4 text-sm">
                        {project.websiteUrl && (
                          <a href={project.websiteUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent)] hover:underline">
                            Website
                          </a>
                        )}
                        {project.forumUrl && (
                          <a href={project.forumUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            Reference
                          </a>
                        )}
                        {project.twitterUrl && (
                          <a href={project.twitterUrl.startsWith("http") ? project.twitterUrl : `https://x.com/${project.twitterUrl.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            Builder X
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[240px] rounded-[1.8rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Review Actions</p>
                    <div className="mt-4 grid gap-3">
                      <button
                        disabled={actingId === project.id || project.status === "APPROVED"}
                        onClick={() => handleStatusUpdate(project.id, "APPROVED")}
                        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actingId === project.id ? "Saving..." : "Approve Project"}
                      </button>
                      <button
                        disabled={actingId === project.id || project.status === "REJECTED"}
                        onClick={() => handleStatusUpdate(project.id, "REJECTED")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(130,90,109,0.24)] bg-[rgba(130,90,109,0.12)] px-6 py-3 font-semibold text-[var(--text-primary)] transition-all hover:bg-[rgba(130,90,109,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Project
                      </button>
                      <button
                        disabled={actingId === project.id}
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-6 py-3 font-semibold text-red-200 transition-all hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </button>
                    </div>

                    <div className="mt-5 rounded-[1.25rem] border border-[var(--border-light)] bg-black/20 px-4 py-3 text-xs leading-6 text-[var(--text-secondary)]">
                      Public governance only starts after approval. Deleting removes the project and its votes from the explorer.
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}
