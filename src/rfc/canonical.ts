import { RFC_EDITOR_ORIGIN } from "~/lib/site";

export type PathTarget =
  | { kind: "rfc"; num: number }
  | { kind: "external"; url: string };

export type NotFoundAction =
  | { type: "redirect"; to: string }
  | { type: "missing"; num: number }
  | { type: "external"; url: string };

// Every rfc-editor.org URL shape that names a single RFC.
const RFC_PATHS = [
  /^\/rfc\/rfc0*(\d+)(?:\.(?:txt|html|pdf|xml|json|ps))?\/?$/i,
  /^\/info\/rfc0*(\d+)\/?$/i,
  /^\/errata\/rfc0*(\d+)\/?$/i,
  /^\/rfc\/inline-errata\/rfc0*(\d+)(?:\.html)?\/?$/i,
];

export function resolvePath(pathname: string, search = ""): PathTarget {
  for (const pattern of RFC_PATHS) {
    const match = pattern.exec(pathname);
    if (match) return { kind: "rfc", num: Number(match[1]) };
  }
  return { kind: "external", url: `${RFC_EDITOR_ORIGIN}${pathname}${search}` };
}

export function canonicalRfcPath(num: number): string {
  return `/rfc/rfc${num}/`;
}

/**
 * What 404.html does with the address it was served for. A canonical path
 * that still 404s is an RFC missing from the index: redirecting it again
 * would loop.
 */
export function notFoundAction(pathname: string, search: string): NotFoundAction {
  const target = resolvePath(pathname, search);
  if (target.kind === "external") return { type: "external", url: target.url };
  const canonical = canonicalRfcPath(target.num);
  if (pathname === canonical) return { type: "missing", num: target.num };
  return { type: "redirect", to: canonical };
}

export function parseUserInput(input: string): number | null {
  const trimmed = input.trim();
  const bare = /^(?:rfc\s*)?0*(\d+)$/i.exec(trimmed);
  if (bare) return Number(bare[1]);
  try {
    const target = resolvePath(new URL(trimmed).pathname);
    return target.kind === "rfc" ? target.num : null;
  } catch {
    return null;
  }
}
