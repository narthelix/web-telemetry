/**
 * narthelix web yuzeylerinin istemci telemetrisi — Faro Web SDK sarmalayicisi.
 *
 * ADR-0054'un web izdusumu (narthelix/muznara#836). Mobil tarafta ayni karar
 * `faro` Dart paketiyle uygulandi; burada ayni ingest ucuna (Alloy'un
 * `faro.receiver`'i) tarayicidan yaziliyor. Yeni satici yok, ikinci fatura yok.
 *
 * Bu paketin var olma sebebi dort Next.js uygulamasinin ayni uc seyi ayni
 * sekilde yapmasi: guvenli varsayilanlar, tarayici-disi ortamda sessiz kalmak,
 * ve hicbir kosulda uygulamayi dusurmemek.
 */

import {
  ErrorsInstrumentation,
  NavigationInstrumentation,
  PerformanceInstrumentation,
  SessionInstrumentation,
  ViewInstrumentation,
  WebVitalsInstrumentation,
  ConsoleInstrumentation,
  UserActionInstrumentation,
  initializeFaro,
  type Instrumentation,
} from '@grafana/faro-web-sdk';

export interface WebTelemetryOptions {
  /**
   * Bu yuzeyin adi — her uygulama FARKLI bir ad tasimali.
   *
   * Receiver tek bir paylasilan `api_key` kabul ediyor, yani anahtar basina
   * ayrim yapilamiyor. Ama rate limit `strategy = "per_app"` ile calisiyor ve
   * uygulama adina bakiyor: farkli adlar = bagimsiz limitler. Ayni adi iki
   * uygulamaya vermek onlari ayni kovaya sokar.
   */
  appName: string;
  appVersion: string;
  environment: string;
  /** Alloy `faro.receiver`'inin public ucu. */
  collectorUrl: string;
  /**
   * Paylasilan app key. Tarayicida TANIM GEREGI gorunur — JS paketinin icinde
   * duruyor. Gizli bir sey degil: bir taramaci botu disarida tutar, kullanici
   * verisini korumaz. Gercek savunma receiver'in rate limiter'i ve ingest'in
   * yalnizca KABUL edip hicbir sorguya cevap vermemesi (ADR-0054 §2).
   */
  apiKey: string;
  /**
   * Kullanici etkilesimlerini yakala. VARSAYILAN KAPALI, ve bu bilincli:
   * Faro'nun user-action enstrümantasyonu tiklanan elemanin GORUNEN METNINI
   * gonderiyor. Mobilde olculdu (muznara#796) — telemetriye "Ana Sayfa",
   * "Kesfet" gibi ekran icerigi dustu. Web'de ayni sinif daha genis: tablo
   * hucresi, musteri adi, teklif tutari. Kimlik dogrulamali yuzeylerde bunlar
   * baskasinin ticari verisi.
   *
   * muznara#838 redaksiyon politikasini karara baglayana kadar kapali kalir.
   */
  captureUserContent?: boolean;
  /**
   * Konsol ciktisini yakala. VARSAYILAN KAPALI: uygulama loglari kullanici
   * verisi tasiyabilir ve bu paket onlari okuyamaz, dolayisiyla guvenli
   * varsayilan sessizlik.
   */
  captureConsole?: boolean;
}

/**
 * React Strict Mode bir effect'i bilerek iki kez calistirir, ve Next.js App
 * Router'da bu gelistirmede normaldir. Iki kez initialize edilen Faro ikinci
 * cagrida uyari basar; modul seviyesinde bayrak bunu sessizce yutuyor.
 */
let initialized = false;

function buildInstrumentations(options: WebTelemetryOptions): Instrumentation[] {
  // Liste ACIKCA kuruluyor, `getWebInstrumentations()` ile DEGIL. Sebebi:
  // varsayilan set user-action ve console'u iceriyor, yani bu paketin kapali
  // tutmak istedigi iki seyi. Varsayilanin icerigi Faro surumleriyle
  // degisebilir; acik liste, bir yukseltmenin sessizce icerik yakalamayi
  // acmasini imkansiz kilar.
  const instrumentations: Instrumentation[] = [
    new ErrorsInstrumentation(),
    new WebVitalsInstrumentation(),
    new PerformanceInstrumentation(),
    new SessionInstrumentation(),
    new ViewInstrumentation(),
    new NavigationInstrumentation(),
  ];

  if (options.captureUserContent) {
    instrumentations.push(new UserActionInstrumentation());
  }
  if (options.captureConsole) {
    instrumentations.push(new ConsoleInstrumentation());
  }

  return instrumentations;
}

/**
 * Telemetriyi baslatir. Tarayici disinda ve hata durumunda SESSIZCE hicbir sey
 * yapmaz.
 *
 * Next.js App Router'da bir `'use client'` bileseninin `useEffect`'inden
 * cagrilmali: Faro yalnizca tarayicida calisir, React Server Component'te
 * calistirmak yan etki uretir.
 */
export function initWebTelemetry(options: WebTelemetryOptions): void {
  // SSR/RSC koruma. `window` yoksa burasi sunucudur ve yapacak bir sey yok.
  if (typeof window === 'undefined') {
    return;
  }
  if (initialized) {
    return;
  }

  // YAPILANDIRMA YOKSA SESSIZCE KAPALI. Bu, fail-open'in konfigurasyon
  // tarafindaki karsiligi: cluster'da ConfigMap/Secret `optional: true` ile
  // baglaniyor, yani biri eksikse pod YINE DE ACILIYOR ve buraya bos string
  // geliyor. O durumda Faro'yu bos bir URL'le baslatmak, her sayfa yuklemesinde
  // basarisiz istek uretmekten baska bir sey yapmaz.
  if (!options.collectorUrl || !options.apiKey) {
    return;
  }

  // FAIL-OPEN (ADR-0054 §3): telemetri hicbir kosulda uygulamayi dusurmez,
  // acilisi bloklamaz, bir surumu geciktirmez. Ayni durus ADR-0006'nin
  // Collector yokken tracing'i kapali birakmasinda da vardi.
  try {
    initializeFaro({
      url: options.collectorUrl,
      apiKey: options.apiKey,
      app: {
        name: options.appName,
        version: options.appVersion,
        environment: options.environment,
      },
      instrumentations: buildInstrumentations(options),
    });
    initialized = true;
  } catch {
    // Bilerek yutuluyor ve bilerek loglanmiyor: bir telemetri hatasini
    // konsola basmak, kullanicinin gordugu tek belirti olurdu.
  }
}

/** Yalnizca test icin: modul seviyesindeki tek-sefer bayragini sifirlar. */
export function __resetForTests(): void {
  initialized = false;
}
