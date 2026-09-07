import { SqliteStore } from '../domain/store.ts';
import { PgStore } from '../domain/pg-store.ts';
import type { Store } from '../domain/store.ts';
import { loadConfig } from '../config.ts';
import { createLogger } from '../logger.ts';
import { Court as CourtImpl } from './court.ts';
import { messageClaimAdapter } from './evidence/message-claim.ts';
import { createUrlInspectionAdapter } from './evidence/url-inspection.ts';
import { contextConsistencyAdapter } from './evidence/context-consistency.ts';
import { createParticipantTestimonyAdapter } from './evidence/participant-testimony.ts';
import { createImageInspectionAdapter } from './evidence/image-inspection.ts';
import type { Transport } from '../transport/types.ts';
import { LocalConsoleTransport } from '../transport/types.ts';

/**
 * Composition root. Wires the store, evidence adapters, court engine, and
 * transport together. The transport choice is the only environment-specific
 * decision; everything else is pure domain logic.
 */
export interface AgentRuntime {
  readonly court: CourtImpl;
  readonly store: Store;
  readonly transport: Transport;
  readonly logger: ReturnType<typeof createLogger>;
}

export function createAgent(options: {
  env?: NodeJS.ProcessEnv;
  transport?: Transport;
  databaseUrl?: string;
  fetchFn?: typeof fetch;
  imageCapabilities?: { ocrAvailable: boolean; venueLookupAvailable: boolean };
}): AgentRuntime {
  const config = loadConfig(options.env);
  const logger = createLogger(config.logLevel);
  const databaseUrl = options.databaseUrl ?? config.databaseUrl;
  // Postgres/Supabase connection strings select PgStore; anything else
  // (a file path or :memory:) uses the local SQLite store.
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
  const store: Store = isPostgres ? new PgStore(databaseUrl) : new SqliteStore(databaseUrl);
  const transport = options.transport ?? new LocalConsoleTransport();
  const fetchFn = options.fetchFn ?? fetch;

  const court = new CourtImpl({
    store,
    config,
    evidenceAdapters: [
      messageClaimAdapter,
      createUrlInspectionAdapter(fetchFn, {
        timeoutMs: config.evidenceRequestTimeoutMs,
        maxRedirects: config.evidenceMaxRedirects,
      }),
      contextConsistencyAdapter,
      createParticipantTestimonyAdapter((caseId) => store.listTestimonies(caseId)),
      createImageInspectionAdapter(
        options.imageCapabilities ?? { ocrAvailable: false, venueLookupAvailable: false },
      ),
    ],
    now: () => new Date(),
  });

  return { court, store, transport, logger };
}

export type { Court } from './court.ts';

