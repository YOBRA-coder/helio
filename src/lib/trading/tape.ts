import { createServerFn } from "@tanstack/react-start";
import { loadTape } from "./tape-fetch.ts";

export type { TapeMarket, TapePayload } from "./tape-fetch.ts";

/** Browser-side fallback path (used only when no server worker is running). */
export const fetchTape = createServerFn({ method: "GET" }).handler(async () => loadTape());

export const fetchResolutionsFn = createServerFn({ method: "POST" })
  .validator((input: { ids: string[] }) => input)
  .handler(async ({ data }) => {
    const { fetchResolutions } = await import("./tape-fetch.ts");
    return fetchResolutions(data.ids);
  });
