import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { getRequestUser, signJwt } from "../auth/jwt.js";
import { collection } from "../mongo.js";
import type { UserDocument } from "../models.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only use letters, numbers, and underscores",
    ),
  email: z.string().trim().email().max(120),
  village: z.string().trim().min(2).max(80),
  mandal: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});

const loginSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(1).max(128),
});

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

async function createAccount(
  name: string,
  username: string,
  email: string,
  village: string,
  mandal: string,
  district: string,
  state: string,
  password: string,
) {
  const passwordHash = hashPassword(password);
  const now = new Date();
  const users = await collection<UserDocument>("users");
  const existing = await users.findOne({ username });
  const nextRole = existing?.role === "ADMIN" ? "ADMIN" : "USER";

  await users.updateOne(
    { username },
    {
      $set: {
        name,
        username,
        email,
        village,
        mandal,
        district,
        state,
        place: `${village}, ${district}`,
        passwordHash,
        role: nextRole,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: randomUUID(),
        bio: "",
        followersCount: 0,
        followingCount: 0,
        plantedTreesCount: 0,
        donatedTreesCount: 0,
        impactScore: 0,
        streakDays: 0,
        badges: [],
        phone: username,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const user = await users.findOne({ username });
  if (!user) throw new Error("Account creation failed");

  return user;
}

function toAuthUser(user: UserDocument) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email ?? null,
    role: user.role,
  };
}

router.post("/auth/register", async (request, response, next) => {
  try {
    const payload = registerSchema.parse(request.body);
    const username = normalizeUsername(payload.username);
    const email = payload.email.trim().toLowerCase();
    const users = await collection<UserDocument>("users");
    const existing = await users.findOne({
      $or: [{ username }, { email }],
      passwordHash: { $exists: true },
    });

    if (existing) {
      response
        .status(409)
        .json({ message: "Account already exists. Please login." });
      return;
    }

    const user = await createAccount(
      payload.name,
      username,
      email,
      payload.village,
      payload.mandal,
      payload.district,
      payload.state,
      payload.password,
    );

    response.status(201).json({
      ok: true,
      message: "Account created. Please login.",
      user: toAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/auth/login", async (request, response, next) => {
  try {
    const payload = loginSchema.parse(request.body);
    const username = normalizeUsername(payload.username);
    const users = await collection<UserDocument>("users");
    const user = await users.findOne({ username });

    if (
      !user?.passwordHash ||
      !verifyPassword(payload.password, user.passwordHash)
    ) {
      response.status(401).json({ message: "Invalid username or password" });
      return;
    }

    const token = signJwt({
      sub: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    response.json({ token, user: toAuthUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/me", (request, response) => {
  const user = getRequestUser(request);

  if (!user) {
    response.status(401).json({ message: "Login required" });
    return;
  }

  response.json({
    user: {
      id: user.sub,
      name: user.name,
      username: user.username,
      role: user.role,
    },
  });
});

export default router;
