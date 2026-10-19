import Link from "next/link";

import { OPERATOR } from "~/lib/operator";

export function Footer({ showLegal = OPERATOR !== null }: { showLegal?: boolean }) {
  return (
    <footer className="mt-auto border-black pt-4 pb-9 sm:border-t-[3px] sm:py-4 lg:px-8 dark:border-black">
      <div className="container mx-auto max-w-4xl space-y-1 px-4 text-center text-sm">
        <p className="font-medium text-black dark:text-neutral-100">
          RFC data from{" "}
          <Link href="https://www.rfc-editor.org" target="_blank" rel="noopener noreferrer" className="neo-link hover:underline">
            rfc-editor.org
          </Link>
          <span className="mx-2">/</span>
          Forked from{" "}
          <Link href="https://github.com/ahmedkhaleel2004/gitdiagram" target="_blank" rel="noopener noreferrer" className="neo-link hover:underline">
            GitDiagram
          </Link>
          {showLegal ? (
            <>
              <span className="mx-2">/</span>
              <a href="/impressum/" className="neo-link hover:underline">
                Impressum
              </a>
              <span className="mx-2">/</span>
              <a href="/privacy/" className="neo-link hover:underline">
                Privacy
              </a>
            </>
          ) : null}
        </p>
        <p className="text-xs text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">
          Not affiliated with the IETF, the IETF Trust or the RFC Editor. The RFC text is
          authoritative; visuals and explanations are provided as is, without warranty.
        </p>
      </div>
    </footer>
  );
}
