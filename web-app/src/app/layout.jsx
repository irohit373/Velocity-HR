import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { UserProvider } from "@/providers/UserProvider";
import NavbarWrapper from "@/components/NavbarWrapper";

export const metadata = {
  title: "VELOCITY H",
  description: "AI Powered Platform For Recruitment & Scheduling",
};

// Force dynamic rendering for all pages that use cookies
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  // Server-side: Fetch user data once per request
  // This runs on the server, so it can use cookies() safely
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body className="bg-base-100" suppressHydrationWarning>
        {/* Wrap entire app in UserProvider to share user data */}
        <UserProvider user={user}>
          <NavbarWrapper />
          <main className="min-h-screen">
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
