/**
 * Reads created entity id from save responses.
 * Backend returns: `{ data: <id>, message: "...", statusCode: 200 }`
 * Also supports axios wrappers and `{ data: { id } }`.
 */
export function extractCreatedEntityId(res: unknown): number | undefined {
  const parseId = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const isAxiosShape = (v: unknown) =>
    typeof v === "object" &&
    v !== null &&
    "data" in v &&
    ("status" in v || "headers" in v || "config" in v);

  let cur: unknown = res;
  if (isAxiosShape(cur)) {
    cur = (cur as { data: unknown }).data;
  }

  if (typeof cur === "object" && cur !== null && "data" in cur) {
    const d = (cur as { data: unknown }).data;
    const n = parseId(d);
    if (n != null) return n;
  }

  for (let depth = 0; depth < 8 && cur != null; depth++) {
    const n = parseId(cur);
    if (n != null) return n;
    if (typeof cur !== "object") break;
    const o = cur as Record<string, unknown>;
    const idVal = parseId(o.id);
    if (idVal != null) return idVal;
    if ("data" in o && o.data !== undefined) {
      cur = o.data;
      continue;
    }
    break;
  }
  return undefined;
}
