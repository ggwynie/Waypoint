import type { Category, TrustLevel } from "./api/types";

/** Category presentation. CSS names follow the tokens (`call_for_papers` → `--cat-call-for-papers`). */
export const CAT: Record<Category, { css: string; chipBg: string; label: string; name: string; letter: string; icon: string }> = {
  internship: { css: "internship", chipBg: "var(--catI)", label: "INTERNSHIP", name: "Internships", letter: "I", icon: "M3 8h18v12H3zM9 8V5h6v3M3 13h18" },
  seminar: { css: "seminar", chipBg: "var(--catS)", label: "SEMINAR", name: "Seminars", letter: "S", icon: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" },
  call_for_papers: { css: "call-for-papers", chipBg: "var(--catP)", label: "CALL FOR PAPERS", name: "Calls for papers", letter: "P", icon: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" },
  competition: { css: "competition", chipBg: "var(--catC)", label: "COMPETITION", name: "Competitions", letter: "C", icon: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" },
};

export const catColor = (c: Category) => `var(--cat-${CAT[c].css})`;
export const catText = (c: Category) => `var(--cat-${CAT[c].css}-text)`;
export const catInk = (c: Category) => `var(--cat-${CAT[c].css}-ink)`;

/** Trust labels. */
export const TRUST_LABEL: Record<TrustLevel, string> = {
  official: "Official source",
  corroborated: "Confirmed by 2 sources",
  reviewed: "Reviewed by admin",
};

export const PART_META = {
  major: { color: "var(--part-major)", title: "Major" },
  match: { color: "var(--part-match)", title: "Interests and skills" },
  distance: { color: "var(--part-distance)", title: "Distance" },
  prep_time: { color: "var(--part-prep)", title: "Time to prepare" },
  trust: { color: "var(--part-trust)", title: "Source trust" },
} as const;
