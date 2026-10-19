import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImpressumContent } from "~/components/legal-pages";
import { OPERATOR } from "~/lib/operator";

export const metadata: Metadata = { title: "Impressum — rfc-visual" };

export default function Page() {
  // No operator details yet: never publish a placeholder legal page.
  if (!OPERATOR) notFound();
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 text-base leading-relaxed sm:px-8">
      <ImpressumContent operator={OPERATOR} />
    </main>
  );
}
