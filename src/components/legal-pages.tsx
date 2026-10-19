import type { Operator } from "~/lib/operator";

function Address({ operator }: { operator: Operator }) {
  return (
    <address className="not-italic">
      <span className="block">{operator.name}</span>
      <span className="block">{operator.street}</span>
      <span className="block">{operator.city}</span>
      <span className="block">{operator.country}</span>
      <span className="block">
        Email:{" "}
        <a href={`mailto:${operator.email}`} className="neo-link hover:underline">
          {operator.email}
        </a>
      </span>
      {operator.phone ? <span className="block">Phone: {operator.phone}</span> : null}
    </address>
  );
}

export function ImpressumContent({ operator }: { operator: Operator }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Impressum</h1>
      <p>Information according to § 5 DDG:</p>
      <Address operator={operator} />
      <h2 className="pt-2 text-lg font-semibold">Responsible for content</h2>
      <p>{operator.name}, address as above.</p>
      <h2 className="pt-2 text-lg font-semibold">RFC text</h2>
      <p>
        RFC text and quotations are published by the IETF and reproduced under the IETF Trust Legal
        Provisions. This site is not affiliated with the IETF, the IETF Trust or the RFC Editor.
      </p>
    </div>
  );
}

export function PrivacyContent({ operator }: { operator: Operator }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Privacy</h1>

      <h2 className="pt-2 text-lg font-semibold">Controller</h2>
      <Address operator={operator} />

      <p>
        This site uses no cookies, no analytics and no tracking. Search runs entirely in your
        browser. Your light/dark theme choice is stored only in your browser&apos;s local storage.
        Fonts are served from this site.
      </p>

      <h2 className="pt-2 text-lg font-semibold">Hosting: Netlify</h2>
      <p>
        The site is hosted by Netlify, Inc. When you visit a page, Netlify processes technical data
        such as your IP address, the requested address, date and time, browser (user agent) and
        referrer, to deliver the site and keep it secure. Legal basis: Art. 6(1)(f) GDPR (our
        legitimate interest in operating a secure website). Netlify may process this data outside
        the EU, including in the USA; see{" "}
        <a href="https://www.netlify.com/privacy/" className="neo-link hover:underline">
          Netlify&apos;s privacy policy
        </a>{" "}
        for retention and the safeguards it uses.
      </p>

      <h2 className="pt-2 text-lg font-semibold">RFC text from rfc-editor.org</h2>
      <p>
        To show an RFC&apos;s text, your browser loads it directly from www.rfc-editor.org, which
        operates on behalf of the IETF. That server therefore sees your IP address and the RFC you
        requested. See the{" "}
        <a href="https://www.ietf.org/privacy-statement/" className="neo-link hover:underline">
          IETF privacy statement
        </a>
        . Legal basis: Art. 6(1)(f) GDPR (showing you the RFC you asked for).
      </p>

      <h2 className="pt-2 text-lg font-semibold">GitHub</h2>
      <p>
        Links such as &ldquo;Help verify this visual&rdquo; open github.com. Data is only sent to
        GitHub if you follow such a link; see{" "}
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
          className="neo-link hover:underline"
        >
          GitHub&apos;s privacy statement
        </a>
        .
      </p>

      <h2 className="pt-2 text-lg font-semibold">Your rights</h2>
      <p>
        You have the right to access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17),
        restriction of processing (Art. 18), data portability (Art. 20) and to object to processing
        based on legitimate interests (Art. 21). Contact the controller above. You also have the
        right to lodge a complaint with a data protection supervisory authority (Art. 77 GDPR).
      </p>
    </div>
  );
}
