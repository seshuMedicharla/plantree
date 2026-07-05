import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { getRequestUserId } from "../auth/jwt.js";
import { collection } from "../mongo.js";
import type {
  NotificationDocument,
  PlantingDocument,
  PostDocument,
} from "../models.js";

const router = Router();
const PLANTING_RADIUS_CM = 100;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const allowedPhotoMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const allowedVideoMimeTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const checkSpotSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  radiusCm: z.number().positive().default(100),
});

const submitPlantingSchema = z.object({
  count: z.number().int().positive(),
  species: z.string().trim().max(80).optional().default("Unknown"),
  caption: z.string().trim().max(240).optional().default(""),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
  hasVideo: z.boolean(),
  photosCount: z.number().int().nonnegative(),
  media: z
    .array(
      z.object({
        type: z.enum(["photo", "video"]),
        name: z.string().trim().min(1).max(180),
        mimeType: z.string().trim().min(1).max(120),
        dataUrl: z.string().startsWith("data:"),
      }),
    )
    .max(4)
    .optional()
    .default([]),
});

const uploadsDir = path.join(process.cwd(), "server/uploads");

function extensionForMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  throw new Error("Unsupported media type");
}

function publicUploadUrl(request: Request, filename: string) {
  return `${request.protocol}://${request.get("host")}/uploads/${filename}`;
}

async function saveMediaFiles(
  request: Request,
  plantingId: string,
  media: z.infer<typeof submitPlantingSchema>["media"],
) {
  await mkdir(uploadsDir, { recursive: true });

  return Promise.all(
    media.map(async (item, index) => {
      const allowedMimeTypes =
        item.type === "photo" ? allowedPhotoMimeTypes : allowedVideoMimeTypes;
      if (!allowedMimeTypes.has(item.mimeType)) {
        throw new Error(
          `${item.type === "photo" ? "Photo" : "Video"} type is not supported`,
        );
      }

      const [, encoded] = item.dataUrl.split(",");
      if (!encoded) throw new Error("Invalid media data");

      const buffer = Buffer.from(encoded, "base64");
      const maxBytes =
        item.type === "photo" ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
      if (buffer.byteLength > maxBytes) {
        throw new Error(
          `${item.type === "photo" ? "Photo" : "Video"} file is too large`,
        );
      }

      const id = randomUUID();
      const filename = `${plantingId}-${index}-${id}.${extensionForMime(item.mimeType)}`;
      await writeFile(path.join(uploadsDir, filename), buffer);

      return {
        id,
        type: item.type,
        url: publicUploadUrl(request, filename),
      };
    }),
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
) {
  const earthRadiusMeters = 6371008.8;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLon = toRadians(toLon - fromLon);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

async function findNearestPlanting(
  lat: number,
  lon: number,
  radiusCm = PLANTING_RADIUS_CM,
) {
  const radiusMeters = radiusCm / 100;
  const plantings = await collection<PlantingDocument>("plantings");
  const candidates = await plantings
    .find({
      status: { $in: ["PENDING", "VERIFIED"] },
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: radiusMeters,
        },
      },
    })
    .limit(1)
    .toArray();

  const nearest = candidates[0];
  if (!nearest) return null;

  const nearestDistanceMeters = distanceMeters(
    lat,
    lon,
    nearest.latitude,
    nearest.longitude,
  );

  return {
    planting: nearest,
    distanceCm: Math.max(0, Math.round(nearestDistanceMeters * 100)),
  };
}

router.post("/plantings/check-spot", async (request, response, next) => {
  try {
    const payload = checkSpotSchema.parse(request.body);
    const radiusCm = Math.max(payload.radiusCm, PLANTING_RADIUS_CM);
    const nearest = await findNearestPlanting(
      payload.lat,
      payload.lon,
      radiusCm,
    );

    if (!nearest) {
      response.json({ available: true, radiusCm });
      return;
    }

    response.json({
      available: false,
      reason: `Already planted within ${radiusCm}cm radius`,
      nearestDistanceCm: nearest.distanceCm,
      existingPlantId: nearest.planting._id,
      radiusCm,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/plantings", async (request, response, next) => {
  try {
    const payload = submitPlantingSchema.parse(request.body);
    const userId = getRequestUserId(request);

    if (!userId) {
      response.status(401).json({ ok: false, message: "Login required" });
      return;
    }

    if (!payload.hasVideo) {
      response
        .status(400)
        .json({ ok: false, message: "Proof video is required" });
      return;
    }

    if (!payload.media.some((item) => item.type === "video")) {
      response
        .status(400)
        .json({ ok: false, message: "Proof reel file is required" });
      return;
    }

    if (!payload.media.some((item) => item.type === "photo")) {
      response
        .status(400)
        .json({ ok: false, message: "At least one plant photo is required" });
      return;
    }

    const now = new Date();
    const plantingId = randomUUID();
    const plantings = await collection<PlantingDocument>("plantings");
    const posts = await collection<PostDocument>("posts");
    const notifications =
      await collection<NotificationDocument>("notifications");
    const nearest = await findNearestPlanting(payload.lat, payload.lon);

    if (nearest) {
      response.status(409).json({
        ok: false,
        message: `Planting blocked. Another planting already exists within ${PLANTING_RADIUS_CM}cm.`,
        nearestDistanceCm: nearest.distanceCm,
        existingPlantId: nearest.planting._id,
        radiusCm: PLANTING_RADIUS_CM,
      });
      return;
    }

    const savedMedia = await saveMediaFiles(request, plantingId, payload.media);

    await plantings.insertOne({
      _id: plantingId,
      userId,
      species: payload.species,
      count: payload.count,
      latitude: payload.lat,
      longitude: payload.lon,
      location: {
        type: "Point",
        coordinates: [payload.lon, payload.lat],
      },
      accuracy: payload.accuracy,
      hasVideo: payload.hasVideo,
      photosCount: payload.photosCount,
      status: "PENDING",
      media: savedMedia,
      createdAt: now,
      updatedAt: now,
    });

    await posts.insertOne({
      _id: randomUUID(),
      userId,
      plantingId,
      caption:
        payload.caption ||
        `Planted ${payload.count} ${payload.species} tree(s).`,
      likesCount: 0,
      commentsCount: 0,
      savedCount: 0,
      likedBy: [],
      savedBy: [],
      createdAt: now,
      updatedAt: now,
    });

    await notifications.insertOne({
      _id: randomUUID(),
      userId,
      title: "Planting received",
      body: "Your proof is waiting for verification.",
      read: false,
      createdAt: now,
    });

    response.status(201).json({
      ok: true,
      id: plantingId,
      message: "Planting submitted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
