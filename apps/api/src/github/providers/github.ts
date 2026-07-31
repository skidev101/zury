import { GitHubProviderError, type GitHubActivity, type GitHubCredentials, type GitHubProvider, type GitHubProviderHealth, type GitHubPullRequest, type GitHubRepository } from "../provider.js";

export interface GitHubConfig { clientId: string; clientSecret: string; redirectUri: string; requestTimeoutMs?: number }

export class GitHubApiProvider implements GitHubProvider {
  private readonly timeoutMs: number;
  constructor(private readonly config: GitHubConfig) { this.timeoutMs = config.requestTimeoutMs ?? 10_000; }

  async getAuthorizationUrl(input: { state: string }): Promise<string> {
    const params = new URLSearchParams({ client_id: this.config.clientId, redirect_uri: this.config.redirectUri, scope: "read:user repo", state: input.state });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async completeAuthorization(input: { code: string }): Promise<GitHubCredentials> {
    const result = await this.request<{ access_token?: string }>("https://github.com/login/oauth/access_token", {
      method: "POST", headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ client_id: this.config.clientId, client_secret: this.config.clientSecret, code: input.code, redirect_uri: this.config.redirectUri }),
    });
    if (!result.access_token) throw new GitHubProviderError("AUTHORIZATION_FAILED", "GitHub authorization failed");
    return { accessToken: result.access_token };
  }

  async listRepositories(input: { credentials: GitHubCredentials }): Promise<GitHubRepository[]> {
    const repositories = await this.apiRequest<unknown[]>(`https://api.github.com/user/repos?per_page=100&sort=updated`, input.credentials);
    return repositories.flatMap(normalizeRepository);
  }

  async getActivity(input: { credentials: GitHubCredentials; repositories: GitHubRepository[]; rangeStart: string; rangeEnd: string }): Promise<GitHubActivity> {
    const commits = []; const pullRequests: GitHubPullRequest[] = [];
    for (const repository of input.repositories) {
      const [owner, name] = repository.fullName.split("/");
      if (!owner || !name) continue;
      const query = `since=${encodeURIComponent(input.rangeStart)}&until=${encodeURIComponent(input.rangeEnd)}`;
      const recent = await this.apiRequest<unknown[]>(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits?per_page=50&${query}`, input.credentials);
      commits.push(...recent.flatMap((item) => normalizeCommit(item, repository.fullName)));
      const prs = await this.apiRequest<unknown[]>(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls?state=all&per_page=50&sort=updated&direction=desc`, input.credentials);
      pullRequests.push(...prs.flatMap((item) => normalizePullRequest(item, repository.fullName)).filter((item) => item.updatedAt >= input.rangeStart && item.updatedAt <= input.rangeEnd));
    }
    return { commits, pullRequests };
  }

  async health(): Promise<GitHubProviderHealth> {
    try { await this.request("https://api.github.com/rate_limit", { headers: { accept: "application/vnd.github+json" } }); return { available: true }; }
    catch { return { available: false, message: "GitHub is unavailable just now." }; }
  }

  private apiRequest<T>(url: string, credentials: GitHubCredentials) { return this.request<T>(url, { headers: { accept: "application/vnd.github+json", authorization: `Bearer ${credentials.accessToken}`, "x-github-api-version": "2022-11-28" } }); }
  private async request<T = unknown>(url: string, init: RequestInit): Promise<T> {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok) throw new GitHubProviderError(response.status === 401 || response.status === 403 ? "RECONNECT_REQUIRED" : "UNAVAILABLE", "GitHub request failed");
      return await response.json() as T;
    }
    finally { clearTimeout(timeout); }
  }
}

function normalizeRepository(value: unknown): GitHubRepository[] { const item = value as Record<string, unknown>; return typeof item.id === "number" && typeof item.name === "string" && typeof item.full_name === "string" ? [{ id: String(item.id), name: item.name, fullName: item.full_name, description: typeof item.description === "string" ? item.description : null }] : []; }
function normalizeCommit(value: unknown, repository: string) { const item = value as Record<string, unknown>; const commit = item.commit as Record<string, unknown> | undefined; const author = commit?.author as Record<string, unknown> | undefined; return typeof item.sha === "string" && typeof commit?.message === "string" && typeof author?.date === "string" ? [{ id: item.sha, message: commit.message.split("\n")[0]!, author: typeof author.name === "string" ? author.name : null, committedAt: author.date, repository }] : []; }
function normalizePullRequest(value: unknown, repository: string): GitHubPullRequest[] { const item = value as Record<string, unknown>; const merged = item.merged_at; return typeof item.id === "number" && typeof item.title === "string" && typeof item.html_url === "string" && typeof item.updated_at === "string" ? [{ id: String(item.id), title: item.title, repository, url: item.html_url, updatedAt: item.updated_at, state: merged ? "merged" : item.state === "open" ? "open" : "closed" }] : []; }
