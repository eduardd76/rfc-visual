import { RFC_EDITOR_ORIGIN, SITE_ORIGIN } from "~/lib/site";

// Diagram links may only point at rfc-visual itself or rfc-editor.org.
const ALLOWED_LINK_ORIGINS = new Set([SITE_ORIGIN, RFC_EDITOR_ORIGIN]);

const clickDirective = /^\s*click\s+[a-z_][a-z0-9_-]*\s+"([^"\s]+)"\s*$/iu;

function isAllowedLink(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ALLOWED_LINK_ORIGINS.has(url.origin);
  } catch {
    return false;
  }
}

function isSafeClickDirective(line: string): boolean {
  const target = clickDirective.exec(line)?.[1];
  return target !== undefined && isAllowedLink(target);
}

// Mermaid's lexer tokenizes `click` followed by ANY whitespace run (tab, or
// even a newline — making a bare "click" line continue onto the next line), so
// detection must not assume the single-space form the compiler emits.
const clickDirectiveStart = /^click(\s|$)/u;

export function sanitizeMermaidSourceForRender(source: string): string {
  const lines: string[] = [];
  let insideConfigDirective = false;

  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (insideConfigDirective) {
      insideConfigDirective = !trimmed.includes("}%%");
      continue;
    }
    if (trimmed.startsWith("%%{")) {
      insideConfigDirective = !trimmed.includes("}%%");
      continue;
    }
    if (
      clickDirectiveStart.test(trimmed) &&
      !isSafeClickDirective(line)
    ) {
      continue;
    }
    lines.push(line);
  }

  return lines.join("\n");
}

export function enforceSafeMermaidLinks(root: ParentNode): void {
  for (const anchor of root.querySelectorAll("a")) {
    const rawHref =
      anchor.getAttribute("href") ?? anchor.getAttribute("xlink:href") ?? "";

    try {
      const url = new URL(rawHref, window.location.origin);
      if (!isAllowedLink(url.toString())) {
        anchor.removeAttribute("href");
        anchor.removeAttribute("xlink:href");
        continue;
      }

      anchor.setAttribute("href", url.toString());
      anchor.removeAttribute("xlink:href");
      anchor.setAttribute("rel", "noopener noreferrer");
    } catch {
      anchor.removeAttribute("href");
      anchor.removeAttribute("xlink:href");
    }
  }
}
