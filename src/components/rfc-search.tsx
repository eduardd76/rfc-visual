"use client";

import { useState } from "react";

import { canonicalRfcPath, parseUserInput } from "~/rfc/canonical";

export function RfcSearch() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        const num = parseUserInput(value);
        if (num === null) {
          setError("Enter an RFC number or rfc-editor.org URL");
          return;
        }
        window.location.assign(canonicalRfcPath(num));
      }}
    >
      <label htmlFor="rfc-input" className="sr-only">
        RFC number or URL
      </label>
      <input
        id="rfc-input"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        placeholder="9293 or https://www.rfc-editor.org/rfc/rfc9293"
        className="neo-input min-h-[44px] flex-1 rounded-md border-[3px] border-black px-3 text-base"
      />
      <button
        type="submit"
        className="neo-button min-h-[44px] rounded-md px-5 font-semibold"
      >
        Visualize
      </button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-red-700 sm:basis-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
