import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AppSidebar } from "@/components/AppSidebar";

export const metadata: Metadata = {
  title: "Shop ML Dashboard",
  description: "E-commerce analytics and ML pipeline",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value ?? null;
  const customerName = cookieStore.get("customer_name")?.value ?? null;
  const appModeRaw = cookieStore.get("app_mode")?.value;
  const appMode = appModeRaw === "admin" ? "admin" : "customer";

  return (
    <html lang="en">
      <body>
        <div className="app-root">
          <AppSidebar
            key={appMode}
            mode={appMode}
            customerId={customerId}
            customerName={customerName}
          />
          <div className="app-main">
            <div className="app-main-inner">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
