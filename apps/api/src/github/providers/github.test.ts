import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GitHubApiProvider } from "./github.js";

describe("GitHubApiProvider", () => {
  it("creates a read-only authorization URL with state", () => {
    const provider = new GitHubApiProvider({ clientId: "client", clientSecret: "secret", redirectUri: "http://localhost/callback" });
    const url = new URL(provider.getAuthorizationUrl({ state: "state-value" }));
    assert.equal(url.searchParams.get("scope"), "read:user");
    assert.equal(url.searchParams.get("state"), "state-value");
  });
});
