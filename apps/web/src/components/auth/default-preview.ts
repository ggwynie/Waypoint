import type { Campus } from "@/lib/api";

export function loginPreview(campus: Campus | undefined) {
  const anchor = campus ? { lat: campus.lat, lng: campus.lng } : { lat: 0, lng: 0 };
  return {
    title: "Every opportunity on one map",
    sub: "Internships, seminars, calls for papers and competitions near you, ranked by how well they fit.",
    radiusKm: 25,
    anchor,
    origin: anchor,
    originKind: "campus" as const,
  };
}
