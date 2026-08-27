import "./globals.css";

export const metadata = {
  title: "Social Command Center",
  description: "Operations command centre for social media managers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
