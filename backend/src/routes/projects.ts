import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireCsrf } from "../middleware/csrf";
const router = Router();
const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase();

const isAuthenticated = (req: any, res: any, next: any) => {
  const address = req.session?.siwe?.address;
  if (!address) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please connect wallet and sign in." });
  }
  next();
};

const isAdmin = (req: any, res: any, next: any) => {
  const address = req.session?.siwe?.address;

  if (!adminWalletAddress) {
    return res.status(500).json({ success: false, message: "ADMIN_WALLET_ADDRESS is not configured." });
  }

  if (!address || address.toLowerCase() !== adminWalletAddress) {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }

  next();
};

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const sanitizeText = (text: string) => text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    const projects = await prisma.project.findMany({
      where: status ? { status: status as string } : {},
      include: {
        votes: true,
        _count: { select: { votes: true } }
      },
    });

    const projectsWithScores = projects.map(p => {
      const upvotes = p.votes.filter(v => v.isUpvote).length;
      const downvotes = p.votes.filter(v => !v.isUpvote).length;
      return { ...p, votes: undefined, upvotes, downvotes, netScore: upvotes - downvotes };
    }).sort((a, b) => b.netScore - a.netScore);

    res.json({ success: true, data: projectsWithScores });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch projects" });
  }
});

router.get("/featured", async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "APPROVED" },
      take: 6,
      include: {
        votes: true,
        _count: { select: { votes: true } }
      }
    });

    const projectsWithScores = projects.map(p => {
      const upvotes = p.votes.filter(v => v.isUpvote).length;
      const downvotes = p.votes.filter(v => !v.isUpvote).length;
      return { ...p, votes: undefined, upvotes, downvotes, netScore: upvotes - downvotes };
    }).sort((a, b) => b.netScore - a.netScore);

    res.json({ success: true, data: projectsWithScores });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch featured projects" });
  }
});

router.get("/recommend", async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 3;
    const projects = await prisma.project.findMany({
      where: { status: "APPROVED" },
      take: count,
      include: {
        votes: true,
        _count: { select: { votes: true } }
      }
    });

    const projectsWithScores = projects.map(p => {
      const upvotes = p.votes.filter(v => v.isUpvote).length;
      const downvotes = p.votes.filter(v => !v.isUpvote).length;
      return { ...p, votes: undefined, upvotes, downvotes, netScore: upvotes - downvotes };
    }).sort((a, b) => b.netScore - a.netScore);

    res.json({ success: true, data: projectsWithScores });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
  }
});

router.get("/admin/submissions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "PENDING";
    const projects = await prisma.project.findMany({
      where: { status },
      include: {
        votes: true,
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const submissions = projects.map((project) => {
      const upvotes = project.votes.filter((vote) => vote.isUpvote).length;
      const downvotes = project.votes.filter((vote) => !vote.isUpvote).length;

      return {
        ...project,
        votes: undefined,
        upvotes,
        downvotes,
        netScore: upvotes - downvotes,
      };
    });

    res.json({ success: true, data: submissions });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch admin submissions." });
  }
});

router.post("/admin/projects", requireCsrf, isAuthenticated, isAdmin, async (req: any, res: any) => {
  try {
    const { name, description, websiteUrl, forumUrl, twitterUrl, imageUrl, status = "APPROVED" } = req.body;

    if (!name || typeof name !== "string" || name.length < 3 || name.length > 100) {
      return res.status(400).json({ success: false, message: "Invalid project name. Must be 3-100 characters." });
    }
    if (!description || typeof description !== "string" || description.length < 10 || description.length > 1000) {
      return res.status(400).json({ success: false, message: "Invalid description. Must be 10-1000 characters." });
    }
    if (!websiteUrl || !isValidUrl(websiteUrl)) {
      return res.status(400).json({ success: false, message: "Invalid website URL. Must be a valid HTTP/HTTPS link." });
    }
    if (!forumUrl || !isValidUrl(forumUrl)) {
      return res.status(400).json({ success: false, message: "Invalid reference link." });
    }
    if (imageUrl && !isValidUrl(imageUrl)) {
      return res.status(400).json({ success: false, message: "Invalid image URL." });
    }
    if (!twitterUrl || typeof twitterUrl !== "string" || twitterUrl.length > 150) {
      return res.status(400).json({ success: false, message: "Invalid builder X profile." });
    }
    if (!["APPROVED", "PENDING", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const project = await prisma.project.create({
      data: {
        name: sanitizeText(name),
        description: sanitizeText(description),
        websiteUrl,
        imageUrl: imageUrl || "/seismic-mark.svg",
        forumUrl,
        twitterUrl: sanitizeText(twitterUrl),
        status,
      },
    });

    res.json({ success: true, data: project });
  } catch {
    res.status(400).json({ success: false, message: "Failed to create project manually." });
  }
});

router.post("/", requireCsrf, isAuthenticated, async (req: any, res: any) => {
  try {
    const { name, description, websiteUrl, forumUrl, twitterUrl, imageUrl } = req.body;

    if (!name || typeof name !== "string" || name.length < 3 || name.length > 100) {
      return res.status(400).json({ success: false, message: "Invalid project name. Must be 3-100 characters." });
    }
    if (!description || typeof description !== "string" || description.length < 10 || description.length > 1000) {
      return res.status(400).json({ success: false, message: "Invalid description. Must be 10-1000 characters." });
    }

    if (!websiteUrl || !isValidUrl(websiteUrl)) {
      return res.status(400).json({ success: false, message: "Invalid website URL. Must be a valid HTTP/HTTPS link." });
    }
    if (!forumUrl || !isValidUrl(forumUrl)) {
      return res.status(400).json({ success: false, message: "Invalid forum URL." });
    }
    if (imageUrl && !isValidUrl(imageUrl)) {
      return res.status(400).json({ success: false, message: "Invalid image URL." });
    }

    if (!twitterUrl || typeof twitterUrl !== "string" || twitterUrl.length > 150) {
      return res.status(400).json({ success: false, message: "Invalid Twitter profile." });
    }

    const project = await prisma.project.create({
      data: { 
        name: sanitizeText(name), 
        description: sanitizeText(description), 
        websiteUrl, 
        imageUrl: imageUrl || "/seismic-mark.svg", 
        forumUrl, 
        twitterUrl: sanitizeText(twitterUrl), 
        status: "PENDING" 
      }
    });
    res.json({ success: true, data: project });
  } catch (e) {
    res.status(400).json({ success: false, message: "Failed to create project" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        votes: true,
        _count: { select: { votes: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const upvotes = project.votes.filter((vote) => vote.isUpvote).length;
    const downvotes = project.votes.filter((vote) => !vote.isUpvote).length;

    res.json({
      success: true,
      data: {
        ...project,
        votes: undefined,
        upvotes,
        downvotes,
        netScore: upvotes - downvotes,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch project." });
  }
});

router.post("/:id/vote", requireCsrf, isAuthenticated, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { isUpvote } = req.body;
    const address = req.session.siwe.address;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || project.status !== "APPROVED") {
      return res.status(400).json({ success: false, message: "Only approved projects can be ranked in governance." });
    }

    let user = await prisma.user.findUnique({ where: { address } });
    if (!user) {
      user = await prisma.user.create({ data: { address } });
    }

    await prisma.vote.upsert({
      where: { userId_projectId: { userId: user.id, projectId: id } },
      update: { isUpvote },
      create: { userId: user.id, projectId: id, isUpvote }
    });

    const allVotes = await prisma.vote.findMany({ where: { projectId: id } });
    const upCount = allVotes.filter(v => v.isUpvote).length;
    const downCount = allVotes.filter(v => !v.isUpvote).length;
    const netScore = upCount - downCount;

    if (netScore <= -10) {
      await prisma.project.delete({ where: { id } });
      return res.json({ success: true, message: "Project removed after reaching the negative score threshold.", status: "DELETED" });
    }

    res.json({ success: true, data: { upCount, downCount, netScore } });
  } catch (e) {
    res.status(400).json({ success: false, message: "Voting failed" });
  }
});

router.patch("/:id/status", requireCsrf, isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };

    if (!status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Use APPROVED, REJECTED, or PENDING." });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: project });
  } catch {
    res.status(400).json({ success: false, message: "Failed to update project status." });
  }
});

router.delete("/:id", requireCsrf, isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: "Project deleted." });
  } catch {
    res.status(400).json({ success: false, message: "Failed to delete project." });
  }
});

export default router;
