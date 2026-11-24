import { createHttpApi, type WaypointApi } from "./client";
import { createMockApi } from "./mock/server";
import { getToken } from "../auth";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

/** True while the web app runs against the in-browser demo API instead of FastAPI. */
export const isDemo = baseUrl === "";

export const api: WaypointApi = isDemo ? createMockApi() : createHttpApi(baseUrl.replace(/\/$/, ""), getToken);

export * from "./types";
export type { SavedPatch, WaypointApi } from "./client";
