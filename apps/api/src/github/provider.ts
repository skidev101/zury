export interface GitHubCredentials {
  accessToken: string;
}

export interface GitHubRepository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
}

export interface GitHubCommit {
  id: string;
  message: string;
  author: string | null;
  committedAt: string;
  repository: string;
}

export interface GitHubPullRequest {
  id: string;
  title: string;
  repository: string;
  url: string;
  updatedAt: string;
  state: "open" | "closed" | "merged";
}

export interface GitHubActivity {
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
}

export interface GitHubProviderHealth {
  available: boolean;
  message?: string;
}

export class GitHubProviderError extends Error {
  constructor(public readonly code: "AUTHORIZATION_FAILED" | "RECONNECT_REQUIRED" | "UNAVAILABLE", message: string) {
    super(message);
  }
}

export interface GitHubProvider {
  getAuthorizationUrl(input: { state: string }): Promise<string>;
  completeAuthorization(input: { code: string }): Promise<GitHubCredentials>;
  listRepositories(input: { credentials: GitHubCredentials }): Promise<GitHubRepository[]>;
  getActivity(input: { credentials: GitHubCredentials; repositories: GitHubRepository[]; rangeStart: string; rangeEnd: string }): Promise<GitHubActivity>;
  health(): Promise<GitHubProviderHealth>;
}
