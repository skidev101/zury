import type {
  GitHubActivity,
  GitHubCommit,
  GitHubProvider,
  GitHubPullRequest,
  GitHubRepository,
} from "../provider.js";

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class GitHubApiProvider implements GitHubProvider {
  constructor(private readonly config: GitHubConfig) {}

  getAuthorizationUrl(input: { state: string }): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "read:user",
      state: input.state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string) {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      },
    );
    if (!response.ok) throw new Error("GitHub authorization failed");
    const result = (await response.json()) as { access_token?: string };
    if (!result.access_token) throw new Error("GitHub authorization failed");
    return { accessToken: result.access_token };
  }

  async listRepositories(accessToken: string): Promise<GitHubRepository[]> {
    const result = await this.request<unknown[]>(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      accessToken,
    );
    return result.flatMap(normalizeRepository);
  }

  async getActivity(
    accessToken: string,
    repositories: GitHubRepository[],
  ): Promise<GitHubActivity> {
    const commits: GitHubCommit[] = [];
    const pullRequests: GitHubPullRequest[] = [];
    for (const repository of repositories) {
      const [owner, name] = repository.fullName.split("/");
      if (!owner || !name) continue;
      const recent = await this.request<unknown[]>(
        `https://api.github.com/repos/${owner}/${name}/commits?per_page=5`,
        accessToken,
      );
      commits.push(...recent.flatMap(normalizeCommit));
      const prs = await this.request<unknown[]>(
        `https://api.github.com/repos/${owner}/${name}/pulls?state=open&per_page=10`,
        accessToken,
      );
      pullRequests.push(
        ...prs.flatMap((item) =>
          normalizePullRequest(item, repository.fullName),
        ),
      );
    }
    return { commits, pullRequests };
  }

  private async request<T>(url: string, token: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
      },
    });
    if (!response.ok) throw new Error("GitHub is unavailable");
    return response.json() as Promise<T>;
  }
}

function normalizeRepository(value: unknown): GitHubRepository[] {
  if (!value || typeof value !== "object") return [];
  const item = value as Record<string, unknown>;
  return typeof item.id === "number" &&
    typeof item.name === "string" &&
    typeof item.full_name === "string"
    ? [{ id: String(item.id), name: item.name, fullName: item.full_name }]
    : [];
}
function normalizeCommit(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const item = value as Record<string, unknown>;
  const commit = item.commit as Record<string, unknown> | undefined;
  const author = commit?.author as Record<string, unknown> | undefined;
  const message = typeof commit?.message === "string" ? commit.message.split("\n")[0] : undefined;
  return typeof item.sha === "string" &&
    message &&
    typeof author?.date === "string"
    ? [
        {
          id: item.sha,
          message,
          author: typeof author.name === "string" ? author.name : null,
          committedAt: author.date,
        },
      ]
    : [];
}
function normalizePullRequest(value: unknown, repository: string) {
  if (!value || typeof value !== "object") return [];
  const item = value as Record<string, unknown>;
  return typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.html_url === "string" &&
    typeof item.updated_at === "string"
    ? [
        {
          id: String(item.id),
          title: item.title,
          repository,
          url: item.html_url,
          updatedAt: item.updated_at,
        },
      ]
    : [];
}
