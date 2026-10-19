"use client";

import { useEffect, useState } from "react";

import { RFC_EDITOR_ORIGIN } from "~/lib/site";
import { notFoundAction } from "~/rfc/canonical";

/**
 * The static export's 404.html. rfc-editor.org URL variants (.txt, /info/,
 * /errata/, …) have no prebuilt page, so they arrive here and are sent on to
 * the canonical RFC page.
 */
export function NotFoundRedirect() {
  const [missing, setMissing] = useState<number | null>(null);

  useEffect(() => {
    const action = notFoundAction(window.location.pathname, window.location.search);
    if (action.type === "redirect") window.location.replace(action.to);
    else if (action.type === "external") window.location.replace(action.url);
    else setMissing(action.num);
  }, []);

  if (missing === null) {
    return <p className="text-base">Redirecting…</p>;
  }
  return (
    <>
      <h1 className="text-2xl font-bold sm:text-3xl">
        RFC {missing} isn&apos;t in the rfc-editor.org index (yet).
      </h1>
      <p className="mt-4 text-base">
        <a
          href={`${RFC_EDITOR_ORIGIN}/rfc/rfc${missing}`}
          className="neo-link hover:underline"
        >
          Check rfc-editor.org
        </a>
      </p>
    </>
  );
}
