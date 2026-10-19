/** @type {import("next").NextConfig} */
const config = {
  // Static export: every page is prebuilt, there is no runtime backend.
  output: "export",
  // Pages land at out/rfc/rfcN/index.html. Without this, Next writes its RSC
  // payload to out/rfc/rfcN.txt, which would shadow the real
  // rfc-editor.org-style URL /rfc/rfcN.txt.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default config;
