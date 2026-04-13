import DashboardLayout from "@/components/common/layout/DashboardLayout";
import { Providers } from "@/components/common/provider/Providers";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardLayout>{children}</DashboardLayout>
    </Providers>
  );
}