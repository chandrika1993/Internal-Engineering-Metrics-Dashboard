// Update the internal interface to match what your DB returns
interface RawDeployment {
  deployedAt: Date | string;
}

interface RawPullRequest {
  mergedAt: Date | string | null;
}

/**
 * Calculates total deployments in the last 7 days.
 * Since 'history' is a list of individual records, we filter by date and return the count.
 */
export function calcDeploys7d(history: RawDeployment[]): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  return history.filter((d) => {
    const time = new Date(d.deployedAt).getTime();
    return time >= cutoff;
  }).length;
}

/**
 * Calculates the number of pull requests merged in the last 7 days.
 */
export function calcPrsMerged7d(prs: RawPullRequest[]): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  return prs.filter((pr) => {
    if (!pr.mergedAt) return false;
    const time = new Date(pr.mergedAt).getTime();
    return time >= cutoff;
  }).length;
}