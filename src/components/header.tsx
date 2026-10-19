import Link from "next/link";

import { GITHUB_REPO_URL } from "~/lib/site";

export function Header() {
  return (
    <header className="border-b-[3px] border-black">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="text-xl font-semibold">
          rfc<span className="text-purple-600">-visual</span>
        </Link>
        <Link
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-link text-sm font-medium hover:underline"
        >
          GitHub
        </Link>
      </div>
    </header>
  );
}
