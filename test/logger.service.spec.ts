import { LoggerService } from "../src/logger/logger.service";

describe("LoggerService central transport", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-07-06T10:11:12.000Z"));
    process.env = { ...originalEnv };
    process.env.LOGGING_SERVICE_URL = "http://logging-microservice:3367";
    delete process.env.LOGGING_SERVICE_API_PATH;
    process.env.SERVICE_NAME = "warehouse-microservice";
    consoleLogSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
    global.fetch = originalFetch;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("posts sanitized metadata without blocking console fallback", () => {
    const logger = new LoggerService();

    logger.log("stock updated", "StockService", {
      duration_ms: 42,
      correlation_id: "corr-1",
      productId: "product-1",
      token: "secret-token",
      nested: { apiKey: "secret-key", quantity: 5 },
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      "2026-07-06T10:11:12.000Z [StockService] stock updated",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://logging-microservice:3367/api/logs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      },
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toEqual({
      level: "log",
      message: "stock updated",
      service: "warehouse-microservice",
      timestamp: "2026-07-06T10:11:12.000Z",
      duration_ms: 42,
      correlation_id: "corr-1",
      metadata: {
        productId: "product-1",
        token: "[REDACTED]",
        nested: { apiKey: "[REDACTED]", quantity: 5 },
        context: "StockService",
      },
    });
  });

  it("is fail-open when central transport rejects", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("logging unavailable"),
    );
    const logger = new LoggerService();

    expect(() =>
      logger.error("reservation failed", "stack", "ReservationsService"),
    ).not.toThrow();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "2026-07-06T10:11:12.000Z [ReservationsService] reservation failed",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith("stack");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("skips transport when LOGGING_SERVICE_URL is missing", () => {
    delete process.env.LOGGING_SERVICE_URL;
    const logger = new LoggerService();

    logger.warn("local only", "LoggerService");

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "2026-07-06T10:11:12.000Z [LoggerService] WARN: local only",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
