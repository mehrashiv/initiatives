import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { NavigationTracker } from "@/components/layout/navigation-tracker";
import { ViewAsProvider } from "@/components/layout/view-as-context";
import { getServerClient } from "@/lib/insforge-server";
import type { AuthUser } from "@/types";
import "./globals.css";

export const metadata: Metadata = {
  title: "Initiative Tracker | Nile",
  description: "Track strategic initiatives, projects, and tasks at Nile.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const insforge = await getServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  let user: AuthUser | null = null;
  if (data.user) {
    const { data: profile } = await insforge.database
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    user = {
      name: data.user.profile?.name ?? data.user.email,
      email: data.user.email,
      role: profile?.role === "admin" ? "admin" : "user",
    };
  }

  return (
    <html lang="en" className="h-full font-sans antialiased">
      <body className="flex min-h-full flex-col bg-surface-subtle text-text-primary">
        <NavigationTracker />
        <ViewAsProvider key={user?.role ?? "user"} realRole={user?.role ?? "user"}>
          <Navbar user={user} />
          {children}
        </ViewAsProvider>
      </body>
    </html>
  );
}
