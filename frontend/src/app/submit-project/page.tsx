"use client";

import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ArrowLeft, FileCheck2, Lock, Send } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export default function SubmitProjectPage() {
  const { isLoggedIn, isConnected, prepareForConnect } = useWallet();
  const mounted = useIsMounted();
  const { open } = useWeb3Modal();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [forumUrl, setForumUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api`;

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Connect and sign in first to submit a project.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}/projects`,
        {
          name,
          description,
          websiteUrl,
          forumUrl,
          twitterUrl,
          imageUrl: imageUrl || "/seismic-mark.svg",
        },
        { withCredentials: true }
      );

      setName("");
      setDescription("");
      setWebsiteUrl("");
      setImageUrl("");
      setPreviewUrl(null);
      setForumUrl("");
      setTwitterUrl("");
      alert("Project submitted. It will stay pending until admin approval.");
    } catch (error: any) {
      alert(error.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-xl p-8 md:p-10">
          <div className="mb-8 flex items-center gap-4">
            <BrandMark className="h-16 w-16 rounded-[1.5rem]" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Builder Intake</p>
              <h1 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Submit a Seismic Project</h1>
            </div>
          </div>

          <p className="mb-10 text-sm leading-7 text-[var(--text-secondary)]">
            This page is for builders. Submitted projects do not go live right away. Every submission stays pending until it is
            reviewed and approved by the admin.
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
              Connect Wallet
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12">
      <a
        href="/"
        className="group inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to explorer
      </a>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="grid gap-5">
          <div className="glass-card p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Builder Entry</p>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] text-[var(--text-primary)]">Projects enter the explorer through admin approval, not open voting.</h1>
            <p className="mt-6 text-sm leading-7 text-[var(--text-secondary)]">
              Governance is used to rank projects that are already listed. Submission lives on its own page so the flow stays clear
              for both builders and users.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-[1.2rem] bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Review Flow</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  Submit your project, wait for admin review, and once it is approved it will appear in the explorer and become eligible
                  for community ranking.
                </p>
              </div>
            </div>
          </div>
        </section>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={submitProject}
          className="glass-card overflow-hidden p-8 md:p-10"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Project Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] px-5 py-4 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
                placeholder="Seismic Vault"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Website URL</label>
              <input
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] px-5 py-4 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Reference Link</label>
              <p className="text-xs leading-6 text-[var(--text-secondary)]">
                Docs, GitHub, X thread, or any official page that helps explain the project.
              </p>
              <input
                required
                value={forumUrl}
                onChange={(e) => setForumUrl(e.target.value)}
                className="w-full rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] px-5 py-4 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
                placeholder="https://docs.example.com/project"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Builder X</label>
              <input
                required
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] px-5 py-4 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
                placeholder="@username or x.com/username"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Project Visual</label>
            <div className="flex flex-col gap-5 rounded-[1.8rem] border border-[var(--border-light)] bg-white/[0.02] p-5 md:flex-row md:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.5rem] border border-[var(--border-light)] bg-white/[0.03]">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={96}
                    height={96}
                    unoptimized
                    className="h-full w-full object-cover"
                    onError={() => setPreviewUrl(null)}
                  />
                ) : (
                  <BrandMark className="h-full w-full rounded-[1.5rem]" />
                )}
              </div>
              <input
                required
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                className="w-full rounded-[1.2rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Why it matters on Seismic</label>
              <span className={`text-[10px] font-bold ${description.length >= 300 ? "text-[#d98b8b]" : "text-[var(--text-muted)]"}`}>
                {description.length} / 300
              </span>
            </div>
            <textarea
              required
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-36 w-full resize-none rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] px-5 py-4 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--accent)]"
              placeholder="Explain the Seismic use case, why users should discover it here, and what makes it relevant."
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-8 flex w-full items-center justify-center gap-3 py-4 text-base">
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit for Admin Review"}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
