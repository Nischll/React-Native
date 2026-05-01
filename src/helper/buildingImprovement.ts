import { BASE_URL } from "@/src/constants/env";
import { BuildingImprovementImageResponse } from "@/src/types/building-improvements.type";

export function resolveImage(img: BuildingImprovementImageResponse): string {
  const path = img.fileUrl ?? img.storedPath ?? "";

  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/api")) {
    return `${BASE_URL.replace(/\/api$/, "")}${path}`;
  }

  return `${BASE_URL}${path}`;
}

export function getImageSide(img: BuildingImprovementImageResponse) {
  return img.imageSide ?? img.side;
}

export function splitImages(images: BuildingImprovementImageResponse[]) {
  const before = images.filter((img) => getImageSide(img) === "BEFORE");
  const after = images.filter((img) => getImageSide(img) === "AFTER");

  return { before, after };
}

export function buildImageUris(
  before: BuildingImprovementImageResponse[],
  after: BuildingImprovementImageResponse[],
) {
  return [...before.map(resolveImage), ...after.map(resolveImage)];
}
