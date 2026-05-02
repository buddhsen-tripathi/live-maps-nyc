import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYC Bestie · every NYC map, one place",
  description:
    "NYC Bestie aggregates every public NYC map into themed meta-maps and makes them queryable through a natural-language agent. Hosted at maps.nyc.network.",
};

// Inline script: set theme class before paint to avoid flash of wrong theme.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('block-maps:theme');
    if (t !== 'light') t = 'dark';
    document.documentElement.classList.add(t);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
