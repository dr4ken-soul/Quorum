/**
 * Runtime configuration.
 *
 * Secrets belong only in the agent runtime. Never expose a service key through
 * a NEXT_PUBLIC_ variable or through a log line.
 */
export interface Config {
  readonly photonAgentId: string | null;
  readonly photonApiKey: string | null;
  readonly photonApiBaseUrl: string | null;
  readonly photonWebhookSecret: string | null;
  readonly photonEnvironment: string;
  readonly evidenceRequestTimeoutMs: number;
  readonly evidenceMaxRedirects: number;
  readonly databaseUrl: string;
  readonly caseRetentionDays: number;
  readonly deliberationTimeoutMinutes: number;
  readonly maxMessageChars: number;
  readonly logLevel: string;
}

function optional(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function int(value: string | undefined, fallback: number, min = 1): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    photonAgentId: optional(env.PHOTON_AGENT_ID),
    photonApiKey: optional(env.PHOTON_API_KEY),
    photonApiBaseUrl: optional(env.PHOTON_API_BASE_URL),
    photonWebhookSecret: optional(env.PHOTON_WEBHOOK_SECRET),
    photonEnvironment: optional(env.PHOTON_ENVIRONMENT) ?? 'development',
    evidenceRequestTimeoutMs: int(env.EVIDENCE_REQUEST_TIMEOUT_MS, 8000, 100),
    evidenceMaxRedirects: int(env.EVIDENCE_MAX_REDIRECTS, 5, 0),
    databaseUrl: optional(env.DATABASE_URL) ?? 'data/quorum.db',
    caseRetentionDays: int(env.CASE_RETENTION_DAYS, 30, 1),
    deliberationTimeoutMinutes: int(env.DELIBERATION_TIMEOUT_MINUTES, 60, 1),
    maxMessageChars: int(env.MAX_MESSAGE_CHARS, 4000, 100),
    logLevel: optional(env.LOG_LEVEL) ?? 'info',
  };
}
