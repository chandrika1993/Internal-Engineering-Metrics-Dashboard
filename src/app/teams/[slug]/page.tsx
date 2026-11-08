import { TEAMS } from "@/db/seedData";
import TeamDetailPage from "./TeamDetailPage";

// Pre-renders the seeded teams (needed for the static live demo). Other slugs
// still render on demand in regular builds.
export function generateStaticParams() {
  return TEAMS.map((t) => ({ slug: t.slug }));
}

export default function Page() {
  return <TeamDetailPage />;
}
