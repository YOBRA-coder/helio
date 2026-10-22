import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PwaRegister } from "@/components/pwa";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { DeskProvider } from "@/components/desk-provider";
import { Shell } from "@/components/widgets";
import appCss from "../styles.css?url";

const APP_NAME = "Helios Desk";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#101512" },
      {
        name: "description",
        content: "Paper-first Polymarket BTC trading desk with manual approval, risk gates, and a baseline probability model.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-180.png" },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <PwaRegister />
        <AuthProvider>
          <DeskProvider>
            <Shell>
              <Outlet />
            </Shell>
          </DeskProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
