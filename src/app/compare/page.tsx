// src/app/compare/page.tsx — wrap the export with Suspense

import { Suspense } from "react";
import ComparePage from "./ComparePage"; // rename current page.tsx to ComparePage.tsx

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ComparePage />
    </Suspense>
  );
}