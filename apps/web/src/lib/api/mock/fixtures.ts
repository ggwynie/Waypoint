import type { Campus, Category, District, Major, Tag, TrustLevel } from "../types";

/* Demo reference data and listings for the in-browser demo API. Taken from the Dashboard mockup.
 * District codes here are demo slugs, not Kemendagri codes; the real seeds live in db/seeds. */

const LAT0 = -6.1281;
const LNG0 = 106.8327;
const PX_PER_KM = 12;

/** Inverse of the map projection, so mockup pixel offsets from campus become coordinates. */
export function fromScenePx(dxPx: number, dyPx: number) {
  const dxKm = dxPx / PX_PER_KM;
  const dyKm = dyPx / PX_PER_KM;
  return {
    lat: +(LAT0 - dyKm / 110.57).toFixed(6),
    lng: +(LNG0 + dxKm / (111.32 * Math.cos((LAT0 * Math.PI) / 180))).toFixed(6),
  };
}

export const MAJORS: Major[] = [
  "Computer Science",
  "Information Systems",
  "Management",
  "Accounting",
  "Communication Studies",
  "Visual Communication Design",
  "Hospitality and Tourism",
].map((name, i) => ({ id: i + 1, name, slug: name.toLowerCase().replace(/ /g, "_") }));

const CAMPUS_PX: [string, number, number][] = [
  ["Bunda Mulia University, Ancol campus", 0, 0],
  ["Bunda Mulia University, Serpong campus", -380, 330],
  ["Tarumanagara University", -150, 140],
  ["Trisakti University", -170, 160],
  ["BINUS University", -230, 190],
  ["Atma Jaya Catholic University", -40, 330],
  ["University of Indonesia", 60, 520],
];
export const CAMPUSES: Campus[] = CAMPUS_PX.map(([name, x, y], i) => ({
  id: i + 1,
  name,
  district_code: "pademangan",
  ...fromScenePx(x, y),
}));

const REGIONS: Record<string, Record<string, [number, number]>> = {
  "North Jakarta": { Pademangan: [20, 15], "Kelapa Gading": [150, 95], "Tanjung Priok": [90, 25], Penjaringan: [-120, 15] },
  "West Jakarta": { "Grogol Petamburan": [-140, 110], Tambora: [-60, 60], "Kebon Jeruk": [-200, 170] },
  "Central Jakarta": { Kemayoran: [30, 80], "Cempaka Putih": [60, 140], Menteng: [-10, 200] },
  "East Jakarta": { "Pulo Gadung": [130, 170], Cakung: [240, 150] },
  "Tangerang City": { Cipondoh: [-300, 170], Karawaci: [-340, 240] },
};
export const DISTRICTS: District[] = Object.entries(REGIONS).flatMap(([city_name, ds]) =>
  Object.entries(ds).map(([name, [x, y]]) => ({
    code: name.toLowerCase().replace(/ /g, "_"),
    name,
    city_name,
    ...fromScenePx(x, y),
  })),
);

const INTERESTS = ["Software", "Data", "Cyber security", "AI", "UI/UX", "Research", "Marketing", "Finance", "Design", "Public policy", "Accounting", "Entrepreneurship"];
const SKILLS = ["JavaScript", "Python", "SQL", "Figma", "Excel", "Canva", "Public speaking", "Networking", "Copywriting"];
const slug = (s: string) => s.toLowerCase().replace(/\//g, "_").replace(/ /g, "_");
export const TAGS: Tag[] = [
  ...INTERESTS.map((label, i) => ({ id: i + 1, label, slug: slug(label), kind: "interest" as const })),
  ...SKILLS.map((label, i) => ({ id: 100 + i, label, slug: slug(label), kind: "skill" as const })),
];

export type DemoOpportunity = {
  id: string;
  title: string;
  category: Category;
  organizer: string;
  mode: "online" | "onsite";
  daysFromToday: number;
  eligibleMajorIds: number[] | null;
  topicTags: string[];
  skillTags: string[];
  trust: TrustLevel;
  minSemester: number | null;
  sourceUrl: string;
  checkedHoursAgo: number;
  scenePx?: [number, number];
};

const CS = 1;
const IS = 2;
const ACC = 4;

export const OPPORTUNITIES: DemoOpportunity[] = [
  { id: "c1", category: "competition", title: "Smart Campus Hackathon", organizer: "National · teams of 3", mode: "online", daysFromToday: 19, eligibleMajorIds: null, topicTags: ["software", "ai"], skillTags: ["javascript", "python"], trust: "official", minSemester: null, sourceUrl: "https://hackathon.example.org/smart-campus", checkedHoursAgo: 3 },
  { id: "s1", category: "seminar", title: "Data Analytics Workshop", organizer: "Seminar · free", mode: "online", daysFromToday: 5, eligibleMajorIds: null, topicTags: ["data"], skillTags: ["sql"], trust: "corroborated", minSemester: null, sourceUrl: "https://events.example.org/data-analytics", checkedHoursAgo: 20 },
  { id: "i1", category: "internship", title: "Frontend Developer Intern", organizer: "Startup · 3 months", mode: "onsite", daysFromToday: 12, eligibleMajorIds: [CS, IS], topicTags: ["software", "ui_ux"], skillTags: ["javascript", "figma"], trust: "corroborated", minSemester: 5, sourceUrl: "https://careers.example.com/frontend-intern", checkedHoursAgo: 6, scenePx: [70, 66] },
  { id: "p1", category: "call_for_papers", title: "Student Symposium on Informatics", organizer: "Informatics symposium", mode: "onsite", daysFromToday: 26, eligibleMajorIds: [CS, IS], topicTags: ["research", "ai"], skillTags: ["python"], trust: "corroborated", minSemester: 5, sourceUrl: "https://symposium.example.ac.id/cfp", checkedHoursAgo: 30, scenePx: [180, 196] },
  { id: "s2", category: "seminar", title: "Cloud Security Seminar", organizer: "Seminar · free", mode: "onsite", daysFromToday: 9, eligibleMajorIds: null, topicTags: ["cyber_security"], skillTags: [], trust: "reviewed", minSemester: null, sourceUrl: "https://seminar.example.org/cloud-security", checkedHoursAgo: 48, scenePx: [-110, 127] },
  { id: "i2", category: "internship", title: "Data Analyst Intern", organizer: "Bank · 6 months", mode: "onsite", daysFromToday: 15, eligibleMajorIds: [CS, IS, ACC], topicTags: ["data"], skillTags: ["sql", "python"], trust: "corroborated", minSemester: 7, sourceUrl: "https://bank.example.co.id/careers/data-analyst", checkedHoursAgo: 10, scenePx: [-340, 150] },
  { id: "p2", category: "call_for_papers", title: "Undergraduate Informatics Journal", organizer: "Journal · online submission", mode: "online", daysFromToday: 33, eligibleMajorIds: null, topicTags: ["research", "software"], skillTags: [], trust: "official", minSemester: null, sourceUrl: "https://journal.example.ac.id/submit", checkedHoursAgo: 72 },
  { id: "c2", category: "competition", title: "Campus UI/UX Sprint", organizer: "Competition · 2 days", mode: "onsite", daysFromToday: 2, eligibleMajorIds: null, topicTags: ["ui_ux"], skillTags: ["figma"], trust: "official", minSemester: null, sourceUrl: "https://sprint.example.org/uiux", checkedHoursAgo: 1, scenePx: [-260, 20] },
];

export const DEMO_EMAIL = "rani@example.com";
