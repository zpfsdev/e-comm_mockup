import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import layoutStyles from "../layout.module.css";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className={layoutStyles.mainWrap}>{children}</main>
      <SiteFooter />
    </>
  );
}
