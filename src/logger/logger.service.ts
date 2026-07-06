import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";

type LogLevel = "log" | "error" | "warn" | "debug" | "verbose";
type CentralLogLevel = "info" | "error" | "warn" | "debug";
type LoggerMetadata = Record<string, unknown>;

type NormalizedLogInput = {
  context?: string;
  metadata: LoggerMetadata;
};

type CentralLogPayload = {
  level: CentralLogLevel;
  message: string;
  service: string;
  timestamp: string;
  duration_ms?: number;
  correlation_id?: string;
  metadata: LoggerMetadata;
};

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|pwd|secret|token|authorization|cookie|api[-_]?key|access[-_]?key|refresh[-_]?key)/i;
const MAX_METADATA_DEPTH = 5;

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly serviceName =
    process.env.SERVICE_NAME ||
    process.env.npm_package_name ||
    "warehouse-microservice";

  private formatMessage(message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}]` : "";
    return `${timestamp} ${ctx} ${message}`;
  }

  log(
    message: unknown,
    contextOrMetadata?: string | LoggerMetadata,
    metadata?: LoggerMetadata,
  ) {
    const normalized = this.normalizeInput(contextOrMetadata, metadata);
    const messageText = this.stringifyMessage(message);

    console.log(this.formatMessage(messageText, normalized.context));
    this.queueCentralLog("log", messageText, normalized);
  }

  error(
    message: unknown,
    trace?: string,
    context?: string,
    metadata?: LoggerMetadata,
  ) {
    const messageText = this.stringifyMessage(message);
    const normalized = this.normalizeInput(context, {
      ...(metadata ?? {}),
      ...(trace ? { trace } : {}),
    });

    console.error(this.formatMessage(messageText, normalized.context));
    if (trace) console.error(trace);
    this.queueCentralLog("error", messageText, normalized);
  }

  warn(
    message: unknown,
    contextOrMetadata?: string | LoggerMetadata,
    metadata?: LoggerMetadata,
  ) {
    const normalized = this.normalizeInput(contextOrMetadata, metadata);
    const messageText = this.stringifyMessage(message);

    console.warn(
      this.formatMessage(`WARN: ${messageText}`, normalized.context),
    );
    this.queueCentralLog("warn", messageText, normalized);
  }

  debug(
    message: unknown,
    contextOrMetadata?: string | LoggerMetadata,
    metadata?: LoggerMetadata,
  ) {
    const normalized = this.normalizeInput(contextOrMetadata, metadata);
    const messageText = this.stringifyMessage(message);

    if (process.env.NODE_ENV !== "production") {
      console.debug(
        this.formatMessage(`DEBUG: ${messageText}`, normalized.context),
      );
    }
    this.queueCentralLog("debug", messageText, normalized);
  }

  verbose(
    message: unknown,
    contextOrMetadata?: string | LoggerMetadata,
    metadata?: LoggerMetadata,
  ) {
    const normalized = this.normalizeInput(contextOrMetadata, metadata);
    const messageText = this.stringifyMessage(message);

    if (process.env.LOG_LEVEL === "verbose") {
      console.log(
        this.formatMessage(`VERBOSE: ${messageText}`, normalized.context),
      );
    }
    this.queueCentralLog("verbose", messageText, normalized);
  }

  private normalizeInput(
    contextOrMetadata?: string | LoggerMetadata,
    metadata?: LoggerMetadata,
  ): NormalizedLogInput {
    if (typeof contextOrMetadata === "string") {
      return {
        context: contextOrMetadata,
        metadata: {
          ...(metadata ?? {}),
          context: contextOrMetadata,
        },
      };
    }

    return {
      metadata: contextOrMetadata ?? metadata ?? {},
    };
  }

  private queueCentralLog(
    level: LogLevel,
    message: string,
    input: NormalizedLogInput,
  ): void {
    const baseUrl = process.env.LOGGING_SERVICE_URL;
    if (!baseUrl) {
      return;
    }

    const apiPath = process.env.LOGGING_SERVICE_API_PATH || "/api/logs";
    const payload = this.buildPayload(level, message, input.metadata);

    void this.postLog(`${baseUrl}${apiPath}`, payload).catch(() => undefined);
  }

  private buildPayload(
    level: LogLevel,
    message: string,
    metadata: LoggerMetadata,
  ): CentralLogPayload {
    const { duration_ms, correlation_id, ...metadataFields } = metadata;
    const payload: CentralLogPayload = {
      level: this.toCentralLevel(level),
      message,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      metadata: this.sanitizeMetadata(metadataFields),
    };

    if (typeof duration_ms === "number" && Number.isFinite(duration_ms)) {
      payload.duration_ms = duration_ms;
    }

    if (typeof correlation_id === "string" && correlation_id.length > 0) {
      payload.correlation_id = correlation_id;
    }

    return payload;
  }

  private toCentralLevel(level: LogLevel): CentralLogLevel {
    if (level === "error" || level === "warn" || level === "debug") return level;
    return "info";
  }

  private async postLog(
    url: string,
    payload: CentralLogPayload,
  ): Promise<void> {
    if (typeof fetch !== "function") {
      return;
    }

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  private sanitizeMetadata(metadata: LoggerMetadata): LoggerMetadata {
    return this.sanitizeValue(
      metadata,
      0,
      new WeakSet<object>(),
    ) as LoggerMetadata;
  }

  private sanitizeValue(
    value: unknown,
    depth: number,
    seen: WeakSet<object>,
  ): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    if (typeof value === "bigint") {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
    }

    if (typeof value !== "object") {
      return String(value);
    }

    if (seen.has(value)) {
      return "[Circular]";
    }

    if (depth >= MAX_METADATA_DEPTH) {
      return "[MaxDepth]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      const sanitizedArray = value.map((entry) =>
        this.sanitizeValue(entry, depth + 1, seen),
      );
      seen.delete(value);
      return sanitizedArray;
    }

    const sanitized: LoggerMetadata = {};
    for (const [key, entry] of Object.entries(value as LoggerMetadata)) {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : this.sanitizeValue(entry, depth + 1, seen);
    }

    seen.delete(value);
    return sanitized;
  }

  private stringifyMessage(message: unknown): string {
    if (typeof message === "string") {
      return message;
    }

    if (message instanceof Error) {
      return message.message;
    }

    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
