import { AgentRuntime } from "./agent/runtime.js";
import { createAIProvider } from "./ai/create-provider.js";
import { env } from "./config/env.js";
import { createCalendarProvider } from "./calendar/create-provider.js";
import { TokenCipher } from "./calendar/crypto.js";
import { CalendarRepository } from "./calendar/repository.js";
import { CalendarService } from "./calendar/service.js";
import { getCalendarEnv, getGitHubEnv } from "./config/env.js";
import { db } from "./db/index.js";
import { ConversationService } from "./conversation/service.js";
import { ConversationRepository } from "./conversation/repository.js";
import { GitHubApiProvider } from "./github/providers/github.js";
import { GitHubService } from "./github/service.js";
import { StudyService } from "./study/service.js";

export const aiProvider = createAIProvider(env);
export const agentRuntime = new AgentRuntime(aiProvider);

const calendarEnv = getCalendarEnv(env);
export const calendarProvider = createCalendarProvider(env);
export const calendarRepository = new CalendarRepository(
  db,
  new TokenCipher(calendarEnv.CALENDAR_TOKEN_ENCRYPTION_KEY),
);
export const calendarService = new CalendarService(calendarProvider, calendarRepository);
const githubEnv = getGitHubEnv(env);
export const githubService = githubEnv
  ? new GitHubService(new GitHubApiProvider({ clientId: githubEnv.GITHUB_CLIENT_ID, clientSecret: githubEnv.GITHUB_CLIENT_SECRET, redirectUri: githubEnv.GITHUB_REDIRECT_URI }), db, new TokenCipher(githubEnv.CALENDAR_TOKEN_ENCRYPTION_KEY))
  : null;
export const conversationRepository = new ConversationRepository(db);
export const conversationService = new ConversationService(agentRuntime, calendarService, conversationRepository, githubService ?? undefined);
export const studyService = new StudyService(agentRuntime);
