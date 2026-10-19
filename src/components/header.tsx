import Link from "next/link";

import { RfcSearch } from "~/components/rfc-search";
import { GITHUB_REPO_URL } from "~/lib/site";

export function Header() {
  return (
    <header className="border-b-[3px] border-black">
      <div className="container mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-8">
        <Link href="/" className="shrink-0 text-xl font-semibold">
          rfc<span className="text-purple-600">-visual</span>
        </Link>
        <div className="order-last w-full sm:order-none sm:max-w-md">
          <RfcSearch compact />
        </div>
        <Link
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="neo-link shrink-0 text-sm font-medium hover:underline"
        >
          GitHub
        </Link>
      </div>
    </header>
  );
}
