# narthelix/web-telemetry — Instructions for Claude

Faro Web SDK sarmalayıcısı: narthelix web yüzeylerinin istemci telemetrisi. ADR-0054'ün web izdüşümü (narthelix/muznara#836).

- Working rules: the [handbook](https://github.com/narthelix/handbook) — [`CONVENTIONS.md`](https://github.com/narthelix/handbook/blob/main/CONVENTIONS.md).
- **Bu bir kütüphane, uygulama değil.** `react-app-ci` reusable workflow'u burada kullanılmaz; CI repo içinde ve ürettiği şey bir npm paketi.
- **İçerik yakalayan enstrümantasyon varsayılan KAPALI** (`captureUserContent`, `captureConsole`) ve öyle kalmalı — muznara#838 redaksiyon politikasını karara bağlayana kadar. Enstrümantasyon listesi `getWebInstrumentations()` ile değil açıkça kurulur; bir Faro yükseltmesi sessizce içerik yakalamayı açamasın diye.
- **Fail-open pazarlık konusu değil** (ADR-0054 §3): telemetri hiçbir koşulda uygulamayı düşürmez, açılışı bloklamaz. Yeni bir kod yolu eklerken `try/catch` dışına çıkma.
- Paket **GitHub Packages**'ta yayınlanıyor. npmjs seçilmedi çünkü `@narthelix` scope'u açmak hesap işlemi gerektiriyordu; GH Packages `GITHUB_TOKEN` ile çalışıyor. Bedeli: tüketen tarafta `.npmrc` — GitHub'ın npm registry'si public paketlerde bile kimlik doğrulaması istiyor.
- Issue'lar narthelix/muznara'da. Branch: `<type>/<issue-no>-<kebab>`, PR gövdesinde bare `#N` yok (tracker başka repoda).
