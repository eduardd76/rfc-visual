import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { SITE_ORIGIN } from "~/lib/site";

export const metadata: Metadata = {
  title: "rfc-visual",
  description:
    "Every RFC, explained visually. Swap rfc-editor.org for rfc.vexpertai.com.",
  metadataBase: new URL(SITE_ORIGIN),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <div className="flex-grow">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
