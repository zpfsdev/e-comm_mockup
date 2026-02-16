import { SiteFooter } from "@/components/site-footer";
import layoutStyles from "../layout.module.css";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <main className={layoutStyles.mainWrap}>{children}</main>
      <SiteFooter />
    </>
  );
}
