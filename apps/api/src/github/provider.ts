export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
}

export interface GitHubCommit {
  id: string;
  message: string;
  author: string | null;
  committedAt: string;
}

export interface GitHubPullRequest {
  id: string;
  title: string;
  repository: string;
  url: string;
  updatedAt: string;
}

export interface GitHubActivity {
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
}

export interface GitHubProvider {
  getAuthorizationUrl(input: { state: string }): string;
  exchangeCode(code: string): Promise<{ accessToken: string }>;
  listRepositories(accessToken: string): Promise<GitHubRepository[]>;
  getActivity(
    accessToken: string,
    repositories: GitHubRepository[],
  ): Promise<GitHubActivity>;
}
