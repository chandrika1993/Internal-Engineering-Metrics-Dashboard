import { REPOS_PER_TEAM } from "@/db/seedData";
import RepoDetailPage from "./RepoDetailPage";

// Pre-renders the seeded repositories (needed for the static live demo). Other
// repositories still render on demand in regular builds.
export function generateStaticParams() {
  return Object.entries(REPOS_PER_TEAM).flatMap(([slug, repos]) =>
    repos.map((r) => ({ slug, repoName: r.name }))
  );
}

export default function Page() {
  return <RepoDetailPage />;
}
