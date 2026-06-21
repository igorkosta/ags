import type { Source, RegistryIndex, RegistryEntry } from "../types/index.js";

export async function fetchRegistry(sources: Source[]): Promise<RegistryIndex> {
  const merged: RegistryIndex = {};

  for (const source of sources) {
    try {
      const res = await fetch(source.indexUrl);

      if (!res.ok) {
        console.error(`Warning: source "${source.name}" returned ${res.status} — skipping`);
        continue;
      }

      const json = (await res.json()) as RegistryIndex;

      for (const [name, entry] of Object.entries(json)) {
        merged[name] = entry;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Warning: failed to fetch source "${source.name}": ${msg} — skipping`);
    }
  }

  return merged;
}

export function searchRegistry(
  index: RegistryIndex,
  query: string,
): Array<{ name: string; entry: RegistryEntry }> {
  const q = query.toLowerCase();
  const results: Array<{ name: string; entry: RegistryEntry }> = [];

  for (const [name, entry] of Object.entries(index)) {
    if (
      name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q)
    ) {
      results.push({ name, entry });
    }
  }

  return results;
}
