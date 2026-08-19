# @narthelix/web-telemetry

narthelix web yüzeylerinin istemci telemetrisi — [Grafana Faro Web SDK](https://github.com/grafana/faro-web-sdk) sarmalayıcısı.

ADR-0054'ün web izdüşümü ([narthelix/muznara#836](https://github.com/narthelix/muznara/issues/836)). Mobil tarafta aynı karar `faro` Dart paketiyle uygulandı; burada aynı ingest ucuna tarayıcıdan yazılıyor. Yeni satıcı yok, ikinci fatura yok — veri Loki ve Tempo'ya, yani zaten koşturduğumuz yığına gidiyor.

## Neden bir paket

Dört bağımsız Next.js uygulaması (`muznara-website`, `narthelix-website`, `muznara-provider`, `muznara-dealer`) aynı üç şeyi aynı şekilde yapmak zorunda: güvenli varsayılanlar, tarayıcı dışında sessiz kalmak, ve hiçbir koşulda uygulamayı düşürmemek. Dört kopya, dördüncü kopyada ayrışır.

## Kurulum

Paket **GitHub Packages**'ta. GitHub'ın npm registry'si public paketlerde bile kimlik doğrulaması istiyor, o yüzden tüketen tarafta bir `.npmrc` gerekiyor:

```
@narthelix:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

CI'da `NODE_AUTH_TOKEN` olarak `GITHUB_TOKEN` yeterli. Yerelde `gh auth token` çıktısı kullanılabilir.

```bash
npm i @narthelix/web-telemetry
```

## Kullanım

Faro **yalnızca tarayıcıda** çalışır — React Server Component'te çalıştırmak yan etki üretir. Bu yüzden bir `'use client'` bileşeninin `useEffect`'inden çağrılmalı:

```tsx
'use client';

import { useEffect } from 'react';
import { initWebTelemetry } from '@narthelix/web-telemetry';

export function Telemetry() {
  useEffect(() => {
    initWebTelemetry({
      appName: 'muznara-website',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
      environment: process.env.NEXT_PUBLIC_ENV ?? 'test',
      collectorUrl: process.env.NEXT_PUBLIC_FARO_URL!,
      apiKey: process.env.NEXT_PUBLIC_FARO_KEY!,
    });
  }, []);

  return null;
}
```

`app/layout.tsx`'te bir kez render edilir.

### `appName` her yüzeyde farklı olmalı

Receiver tek bir paylaşılan `api_key` kabul ediyor, yani anahtar başına ayrım yapılamıyor. Ama rate limit `strategy = "per_app"` ile çalışıyor ve **uygulama adına** bakıyor: farklı adlar = bağımsız limitler. İki uygulamaya aynı adı vermek onları aynı kovaya sokar.

## Varsayılan olarak kapalı olanlar

| Seçenek | Varsayılan | Neden |
|---|---|---|
| `captureUserContent` | `false` | Faro'nun user-action enstrümantasyonu tıklanan elemanın **görünen metnini** gönderiyor. Mobilde ölçüldü ([muznara#796](https://github.com/narthelix/muznara/issues/796)): telemetriye "Ana Sayfa", "Keşfet" gibi ekran içeriği düştü. Web'de aynı sınıf daha geniş — tablo hücresi, müşteri adı, teklif tutarı. Kimlik doğrulamalı yüzeylerde bunlar başkasının ticari verisi. [muznara#838](https://github.com/narthelix/muznara/issues/838) redaksiyon politikasını karara bağlayana kadar kapalı. |
| `captureConsole` | `false` | Uygulama logları kullanıcı verisi taşıyabilir ve bu paket onları okuyamaz. Güvenli varsayılan sessizlik. |

Enstrümantasyon listesi `getWebInstrumentations()` ile değil **açıkça** kuruluyor: varsayılan set bu ikisini içeriyor, ve açık liste bir Faro yükseltmesinin sessizce içerik yakalamayı açmasını imkânsız kılıyor.

## Davranış garantileri

- **Sunucuda hiçbir şey yapmaz** — `window` yoksa sessizce döner.
- **Fail-open** (ADR-0054 §3) — SDK patlarsa hata yutulur ve loglanmaz; bir telemetri hatasını konsola basmak, kullanıcının gördüğü tek belirti olurdu.
- **Tek seferlik** — React Strict Mode effect'leri iki kez çalıştırır; ikinci çağrı sessizce yok sayılır.

App key tarayıcıda **tanım gereği görünür** — JS paketinin içinde duruyor. Gizli bir şey değil: bir tarayıcı botunu dışarıda tutar, kullanıcı verisini korumaz. Gerçek savunma receiver'ın rate limiter'ı ve ingest'in yalnızca kabul edip hiçbir sorguya cevap vermemesi (ADR-0054 §2).

## Yayınlama

`v*` etiketi CI'da `npm publish` tetikler. Sürüm `package.json`'dan okunur.

```bash
npm version patch && git push --follow-tags
```
