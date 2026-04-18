import { Href } from "expo-router";

export const mapToAppRoute = (path: string | null): Href | null => {
  if (!path) return null;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `/(private)${normalizedPath}` as Href;
};
