import type { SiteMediaCategory } from "@the-ride/types";

/**
 * Client-side media validation for the Site Content CMS (Sprint 7.1).
 * `apps/web` is a static export with no server runtime to trigger
 * server-side transcoding from, so this is the entire quality gate for
 * uploads — format/size/duration are enforced here, before the file ever
 * reaches Storage (whose rules re-check format/size as a second layer, but
 * can't check video duration, which requires decoding the file).
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const MIN_VIDEO_SECONDS = 3;
const MAX_VIDEO_SECONDS = 10;

/** Only Hero backgrounds require the 3-10s constraint — other categories don't currently accept video at all, but the check is harmless if that changes. */
const VIDEO_DURATION_CONSTRAINED_CATEGORIES: SiteMediaCategory[] = ["hero", "videos"];

export interface MediaValidationResult {
  ok: boolean;
  error?: string;
  durationSeconds?: number;
}

function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(
        new Error(
          "Could not read video metadata — the file may be corrupt or an unsupported format.",
        ),
      );
    };
    video.src = URL.createObjectURL(file);
  });
}

export async function validateSiteMediaFile(
  file: File,
  category: SiteMediaCategory,
): Promise<MediaValidationResult> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return {
      ok: false,
      error: "Unsupported file type — upload an image (JPG/PNG/WEBP) or an MP4 video.",
    };
  }

  if (isVideo && file.type !== "video/mp4") {
    return { ok: false, error: "Videos must be MP4." };
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Images must be under 5MB." };
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Videos must be under 20MB." };
  }

  if (isVideo && VIDEO_DURATION_CONSTRAINED_CATEGORIES.includes(category)) {
    let durationSeconds: number;
    try {
      durationSeconds = await getVideoDurationSeconds(file);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not read video metadata.",
      };
    }
    if (durationSeconds < MIN_VIDEO_SECONDS || durationSeconds > MAX_VIDEO_SECONDS) {
      return {
        ok: false,
        error: `Videos must be between ${MIN_VIDEO_SECONDS} and ${MAX_VIDEO_SECONDS} seconds long (this one is ${durationSeconds.toFixed(1)}s).`,
      };
    }
    return { ok: true, durationSeconds };
  }

  return { ok: true };
}
