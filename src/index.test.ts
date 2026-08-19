import { beforeEach, describe, expect, it, vi } from 'vitest';

// Faro'nun kendisi mock'lu: bu testlerin isi SDK'nin calistigini kanitlamak
// degil, BU paketin SDK'ya ne verdigini kanitlamak.
const initializeFaro = vi.fn();

vi.mock('@grafana/faro-web-sdk', () => {
  class Named {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
  }
  return {
    initializeFaro: (...args: unknown[]) => initializeFaro(...args),
    ErrorsInstrumentation: class extends Named { constructor() { super('errors'); } },
    WebVitalsInstrumentation: class extends Named { constructor() { super('web-vitals'); } },
    PerformanceInstrumentation: class extends Named { constructor() { super('performance'); } },
    SessionInstrumentation: class extends Named { constructor() { super('session'); } },
    ViewInstrumentation: class extends Named { constructor() { super('view'); } },
    NavigationInstrumentation: class extends Named { constructor() { super('navigation'); } },
    UserActionInstrumentation: class extends Named { constructor() { super('user-action'); } },
    ConsoleInstrumentation: class extends Named { constructor() { super('console'); } },
  };
});

const { initWebTelemetry, __resetForTests } = await import('./index.js');

const OPTIONS = {
  appName: 'muznara-website',
  appVersion: '1.2.3',
  environment: 'production',
  collectorUrl: 'https://telemetry.example/collect',
  apiKey: 'key',
};

function withWindow(fn: () => void): void {
  vi.stubGlobal('window', {});
  try {
    fn();
  } finally {
    vi.unstubAllGlobals();
  }
}

function instrumentationNames(): string[] {
  const call = initializeFaro.mock.calls[0]?.[0] as { instrumentations: { name: string }[] };
  return call.instrumentations.map((i) => i.name);
}

beforeEach(() => {
  initializeFaro.mockReset();
  __resetForTests();
});

describe('initWebTelemetry', () => {
  it('sunucuda hicbir sey yapmaz', () => {
    // vitest node ortaminda kosuyor, yani `window` zaten yok -- RSC/SSR'nin
    // birebir kosulu. Faro burada calisirsa sunucuda yan etki uretir.
    initWebTelemetry(OPTIONS);

    expect(initializeFaro).not.toHaveBeenCalled();
  });

  it('iki kez cagrilirsa bir kez baslatir', () => {
    // React Strict Mode effect'leri bilerek iki kez calistirir.
    withWindow(() => {
      initWebTelemetry(OPTIONS);
      initWebTelemetry(OPTIONS);
    });

    expect(initializeFaro).toHaveBeenCalledTimes(1);
  });

  it('SDK patlarsa hata firlatmaz', () => {
    // ADR-0054 §3: telemetri uygulamayi dusurmez.
    initializeFaro.mockImplementation(() => {
      throw new Error('collector unreachable');
    });

    withWindow(() => {
      expect(() => initWebTelemetry(OPTIONS)).not.toThrow();
    });
  });

  it('varsayilan olarak icerik yakalayan enstrumantasyonu KURMAZ', () => {
    // muznara#796/#838: user-action tiklanan elemanin gorunen metnini
    // gonderiyor, console uygulama loglarini. Ikisi de kullanici/musteri
    // verisi tasiyabilir.
    withWindow(() => initWebTelemetry(OPTIONS));

    expect(instrumentationNames()).not.toContain('user-action');
    expect(instrumentationNames()).not.toContain('console');
  });

  it('varsayilan olarak performans ve hata sinyallerini kurar', () => {
    withWindow(() => initWebTelemetry(OPTIONS));

    expect(instrumentationNames()).toEqual(
      expect.arrayContaining(['errors', 'web-vitals', 'performance', 'session', 'view', 'navigation']),
    );
  });

  it('captureUserContent acikca istendiginde user-action eklenir', () => {
    withWindow(() => initWebTelemetry({ ...OPTIONS, captureUserContent: true }));

    expect(instrumentationNames()).toContain('user-action');
  });

  it('captureConsole acikca istendiginde console eklenir', () => {
    withWindow(() => initWebTelemetry({ ...OPTIONS, captureConsole: true }));

    expect(instrumentationNames()).toContain('console');
  });

  it('uygulama kimligini oldugu gibi gecirir', () => {
    // appName her yuzeyde FARKLI olmali: receiver'in rate limit'i `per_app`
    // stratejisiyle bu ada bakiyor, anahtara degil.
    withWindow(() => initWebTelemetry(OPTIONS));

    expect(initializeFaro).toHaveBeenCalledWith(
      expect.objectContaining({
        url: OPTIONS.collectorUrl,
        apiKey: OPTIONS.apiKey,
        app: { name: 'muznara-website', version: '1.2.3', environment: 'production' },
      }),
    );
  });
});
