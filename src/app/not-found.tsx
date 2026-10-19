import type { Metadata } from "next";

import { NotFoundRedirect } from "~/components/not-found-redirect";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="px-4 pt-5 pb-8 sm:px-8 sm:py-10">
      <div className="neo-panel mx-auto max-w-2xl rounded-lg px-5 py-8 text-center sm:p-10">
        <NotFoundRedirect />
      </div>
    </main>
  );
}
