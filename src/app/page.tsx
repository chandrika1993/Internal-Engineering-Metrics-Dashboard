import DashboardPage from "@/components/DashboardPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardPage />
    </Suspense>
  );
}