/**
 * Local mock of the source site (apkvision.org) so TiyanzVision can be
 * built/run/previewed in offline sandboxes.
 *
 * Usage:
 *   node scripts/mock-source.mjs            # http://127.0.0.1:8931
 *   MOCK_PORT=9000 node scripts/mock-source.mjs
 *
 * Then run the app with:
 *   SOURCE_ORIGIN=http://127.0.0.1:8931 npm run dev
 */
import http from "node:http";
import zlib from "node:zlib";

const PORT = parseInt(process.env.MOCK_PORT || "8931", 10);
const HOST = `127.0.0.1:${PORT}`;
const ORIGIN = `http://${HOST}`;

/* ------------------------------ tiny PNG gen ------------------------------ */

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePng(w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 3);
    raw[rowStart] = 0; // filter none
    for (let x = 0; x < w; x++) {
      const o = rowStart + 1 + x * 3;
      raw[o] = Math.min(255, rgb[0] + ((x * 60) / w) | 0);
      raw[o + 1] = Math.min(255, rgb[1] + ((y * 40) / h) | 0);
      raw[o + 2] = rgb[2];
    }
  }
  return Buffer.concat([sig, pngChunk("IHDR", ihdr), pngChunk("IDAT", zlib.deflateSync(raw)), pngChunk("IEND", Buffer.alloc(0))]);
}

const ICON = makePng(128, 128, [34, 255, 136]);
const SHOT = makePng(320, 180, [47, 107, 255]);

/* --------------------------------- pages ---------------------------------- */

const POST = {
  id: 130581,
  slug: "parahcuy-action-platformer-130581",
  link: `${ORIGIN}/games/action/parahcuy-action-platformer-130581/`,
  title: "Parahcuy – Action Platformer APK",
  content:
    "<p>Parahcuy adalah game action platformer 2D dengan kontrol halus, puluhan level, dan bos yang menantang.</p><h2>Fitur MOD</h2><ul><li>Unlimited money</li><li>Unlimited gems</li></ul>",
  modified: "2026-09-10T08:00:00",
};

const card = (id, href, title, ver, mod, icon) => `
    <a href="${href}" class="mainb-item" id="post-${id}">
      <img src="${icon}" alt="${title}">
      <div class="mainb-title">${title}</div>
      <div class="mainb-cat">${ver}</div>
      <div class="mainb-cat">${mod}</div>
    </a>`;

/* ----- gen-2 lazy <img> variants (mirrors the real template's lazyload) ---- */
// The real site lazy-loads card icons: `src` is a 1x1 placeholder and the
// real URL hides in data-* attributes / srcset / <noscript>. Each variant
// below is one pattern the icon resolver must handle — before the fix every
// variant except imgEager rendered as a blank box on TiyanzVision.
const GIF_1PX = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const SVG_PH = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3C/svg%3E";

const imgEager = (t) => `<img src="${ORIGIN}/img/icon.png" alt="${t}">`;
const imgLazyDataSrc = (t) => `<img src="${GIF_1PX}" data-src="${ORIGIN}/img/icon.png" alt="${t}" loading="lazy">`;
const imgLazySrc = (t) => `<img src="${SVG_PH}" data-lazy-src="${ORIGIN}/img/icon.png" alt="${t}" loading="lazy">`;
// note: /img/icon-140x140.png intentionally 404s on this mock — the resolver
// must pick the 300w candidate, and the client retry strips -140x140 anyway
const imgSrcsetOnly = (t) =>
  `<img src="${GIF_1PX}" srcset="${ORIGIN}/img/icon-140x140.png 140w, ${ORIGIN}/img/icon.png 300w" alt="${t}" loading="lazy">`;
const imgRelative = (t) => `<img src="/img/icon.png" alt="${t}">`;
const imgNoscript = (t) =>
  `<img src="${GIF_1PX}" alt="${t}" loading="lazy"><noscript><img src="${ORIGIN}/img/icon.png" alt="${t}"></noscript>`;

const browseCard = (id, href, title, ver, badge, imgHtml) => `
    <a href="${href}" class="apk-browse-card" data-browse-id="${id}">
      ${imgHtml}
      <span class="apk-browse-card__title">${title}</span>
      ${badge ? `<span class="apk-browse-card__badge">${badge}</span>` : ""}
      <span class="apk-browse-card__version">${ver}</span>
    </a>`;

const HOME = `<!doctype html><html><head><title>APKVision Mock</title></head><body>
  <section>
    <h2>Games</h2>
    <section data-home-panel="new">
      <h3 class="apk-home-panel-title">New</h3>
      <div class="apk-home-card-track">
        ${browseCard(130581, "/games/action/parahcuy-action-platformer-130581/", "Parahcuy – Action Platformer", "v1.3.2", "MOD: Unlimited Money", imgEager("Parahcuy"))}
        ${browseCard(130999, "/games/action/gta-sa-v2-11-311-full-mod-money-130999/", "GTA SA", "v2.11.311", "Full", imgLazyDataSrc("GTA SA"))}
        ${browseCard(130888, "/games/action/split-label-game-130888/", "Split Label Game", "v3.0", "", imgLazySrc("Split Label Game"))}
        ${browseCard(130777, "/games/action/no-label-game-130777/", "No Label Game", "v9.9", "", imgSrcsetOnly("No Label Game"))}
        ${browseCard(135179, "/games/adventure/the-elder-scrolls-v-skyrim-135179/", "The Elder Scrolls V: Skyrim", "v0.25", "Full", imgRelative("Skyrim"))}
        ${browseCard(135280, "/games/action/the-void-135280/", "The Void", "v0.2-dev", "", imgNoscript("The Void"))}
      </div>
      <div class="apk-home-tab-more"><a href="/games/">View all new games</a></div>
    </section>
    <section data-home-panel="ports">
      <h3 class="apk-home-panel-title">Android Ports</h3>
      <div class="apk-home-card-track">
        ${browseCard(131663, "/games/god-of-war-chains-of-olympus-131663/", "God of War: Chains of Olympus", "v0.1.0", "Full", imgLazyDataSrc("God of War"))}
      </div>
      <div class="apk-home-tab-more"><a href="/ports/">View all ports</a></div>
    </section>
  </section>
  <section>
    <h2>Apps</h2>
    <section data-home-panel="new-apps">
      <h3 class="apk-home-panel-title">New apps</h3>
      <div class="apk-home-card-track">
        ${browseCard(130581, "/games/action/parahcuy-action-platformer-130581/", "Parahcuy – Action Platformer", "v1.3.2", "", imgLazyDataSrc("Parahcuy"))}
      </div>
      <div class="apk-home-tab-more"><a href="/app/">View all new apps</a></div>
    </section>
  </section>
  <!-- legacy gen-1 blocks (parser fallback only; ignored when panels exist) -->
  <div class="mainb">
    <div class="mainb-main-title">Best New Releases</div>
    <a href="/best-new-releases/" class="mainb-seemore">More</a>
    ${card(130581, "/games/action/parahcuy-action-platformer-130581/", "Parahcuy – Action Platformer", "v1.3.2", "Unlimited Money", `${ORIGIN}/img/icon.png`)}
  </div>
</body></html>`;

const LISTING = (h1) => `<!doctype html><html><head><title>${h1}</title></head><body>
  <h1>${h1}</h1>
  ${card(130581, "/games/action/parahcuy-action-platformer-130581/", "Parahcuy – Action Platformer", "v1.3.2", "Unlimited Money", `${ORIGIN}/img/icon.png`)}
</body></html>`;

const DETAIL = `<!doctype html><html><head>
  <meta property="og:image" content="${ORIGIN}/img/icon.png">
  <title>Parahcuy – Action Platformer APK Download v1.3.2 free</title>
</head><body>
  <div class="ver-top">
    <div class="ver-top-h1"><h1>Parahcuy – Action Platformer APK</h1></div>
    <span class="ver-top-version">v1.3.2</span>
    <span class="ver-top-version">Unlimited Money</span>
  </div>
  <table class="appinfo">
    <tr><th>Version</th><td>v1.3.2</td></tr>
    <tr><th>Genre</th><td><a href="/games/action/">Action</a></td></tr>
    <tr><th>Developer</th><td>Mobirate Studio</td></tr>
    <tr><th>Package name</th><td>com.mobirate.parahcuy</td></tr>
    <tr><th>Updated</th><td>10 September 2026</td></tr>
    <tr><th>Get it On</th><td><a href="https://play.google.com/store/apps/details?id=com.mobirate.parahcuy">Google Play</a></td></tr>
  </table>
  <p class="rating">Rating: 4.8/5 (1234 votes)</p>
  <div class="votes"><span class="js-version-votes_percent">98%</span> Voices: <span>156</span></div>
  <div class="downloads">
    <a href="/games/action/parahcuy-action-platformer-130581/download/v1.3.2-apk/">Download APK v1.3.2 (84.89 MB)</a>
  </div>
  <div class="screenshots">
    <img src="${ORIGIN}/img/shot1.png" alt="Parahcuy screenshot 1">
    <img src="${GIF_1PX}" data-lazy-src="${ORIGIN}/img/shot2.png" alt="Parahcuy screenshot 2" loading="lazy">
  </div>
</body></html>`;

const DOWNLOAD_PAGE = `<!doctype html><html><head><title>Download Parahcuy – Action Platformer - APK - v1.3.2</title></head><body>
  <p><a href="/games/action/parahcuy-action-platformer-130581/">&laquo; Go back</a></p>
  <h1>Download Parahcuy – Action Platformer - APK - v1.3.2</h1>
  <p>Your download link is almost ready</p>
  <div class="countdown"><span>5</span></div>
  <div class="dl-info">
    <p><b>Filename:</b> ParahCuy-v1.3.2-full-apkvision.apk</p>
    <p><b>Version:</b> v1.3.2</p>
    <p><b>Processor:</b> arm64-v8a, armeabi-v7a</p>
    <p><b>Size:</b> 84.89 MB</p>
  </div>
  <a id="durl" class="fdl-btn downad" href="/dl/parahcuy-action-platformer/ParahCuy-v1.3.2-full-apkvision.apk" rel="nofollow noopener" download><div class="fdl-btn-title"><div>Download  APK</div>ParahCuy-v1.3.2-full-apkvision.apk</div></a>
  <button id="telega" class="fdl-btn mt telegram xx" onclick="generateToken('parahcuy-action-platformer/ParahCuy-v1.3.2-full-apkvision.apk')"><div class="fdl-btn-title"><div>Download from Telegram Bot</div>ParahCuy-v1.3.2-full-apkvision.apk</div></button>
  <script>
    function generateToken(filePath) {
        var data = {
            'file_name': filePath,
            'secret': 'zI7sDzI7sD6fid3432454qQ4u6qQ4u'
        };
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/generate_token.php', true);
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.token) {
                            window.open('https://telegram.me/ApkDownload24Bot?start=' + encodeURIComponent(response.token), '_blank');
                        } else {
                            alert('Error generating token: ' + response.error);
                        }
                    } catch (e) {
                        alert('Error processing server response.');
                    }
                } else {
                    alert('Error sending request.');
                }
            }
        };
        xhr.send(JSON.stringify(data));
    }
  </script>
  <div class="dl-faq">
    <h2>Download FAQs</h2>
    <p>Low download speed — download the file from our server and via the telegram client,
    if the download speed via telegram is low, then there is a problem with your Internet or device!</p>
  </div>
</body></html>`;

/* ------------------- second post: "runaway download anchor" ---------------- */
/*
 * Mirrors a real-world markup bug on the source site: the download button's
 * <a> is never closed, so the HTML parser nests EVERYTHING after it (attention
 * note, FAQ accordion, "New Releases" rail, footer, contact modal) inside the
 * anchor. `$(el).text()` then returns the whole rest of the page as the
 * button's label — the bug TiyanzVision must defend against.
 */
const POST2 = {
  id: 130999,
  slug: "gta-sa-v2-11-311-full-mod-money-130999",
  link: `${ORIGIN}/games/action/gta-sa-v2-11-311-full-mod-money-130999/`,
  title: "GTA SA APK",
  content: "<p>Open-world classic, fully modded.</p>",
  modified: "2026-09-08T08:00:00",
};

const DETAIL_RUNAWAY = `<!doctype html><html><head>
  <meta property="og:image" content="${ORIGIN}/img/icon.png">
  <title>GTA SA APK Download v2.11.311 free</title>
</head><body>
  <div class="ver-top">
    <div class="ver-top-h1"><h1>GTA SA APK</h1></div>
    <span class="ver-top-version">v2.11.311</span>
    <span class="ver-top-version">Full MOD + Money</span>
  </div>
  <table class="appinfo">
    <tr><th>Version</th><td>v2.11.311</td></tr>
    <tr><th>Genre</th><td><a href="/games/action/">Action</a></td></tr>
    <tr><th>Updated</th><td>8 September 2026</td></tr>
  </table>
  <p class="rating">Rating: 4.6/5 (9876 votes)</p>

  <!-- the download button: <a> is NEVER closed -> swallows the whole page -->
  <div class="dl-box">
  <a id="durl" class="fdl-btn downad" href="/games/action/gta-sa-v2-11-311-full-mod-money-130999/download/v2.11.311-apk/" rel="nofollow" download>
    <div class="fdl-btn-title"><div>Download APK &#8212; 2.46 GB</div>GTA-SA-v2.11.311-full-mod-money-apkvision.apk</div>
    <button id="telega" class="fdl-btn telegram" onclick="generateToken('gta-sa/GTA-SA-v2.11.311-full-mod-money-apkvision.apk')">
      <div class="fdl-btn-title"><div>Download from Telegram Bot</div>GTA-SA-v2.11.311-full-mod-money-apkvision.apk</div>
    </button>
    <p class="dl-attention">Attention! This APK is designed for devices with an ARM64 CPU (AArch64, arm64-v8a).
       You won&#8217;t be able to install this modification on a device with a 32-bit processor.</p>
    <div class="dl-report">Can&#8217;t download file? <a href="/contacts/">Send Report</a></div>
    <div class="dl-faq">
      <h2>Download FAQs</h2>
      <h3>Why does Virustotal detect our APK as potentially unwanted or suspicious?</h3>
      <p>We use obfuscation to protect the modifications we&#8217;ve made to the APK files. Upon launching the APK,
         a banner with our website&#8217;s logo and a toast message confirming that the file was downloaded from our
         site will appear.</p>
      <h3>Download link is broken?</h3>
      <p>Since we use caching and the server has special sync functionality, sometimes some newly posted games will
         have broken links for a few minutes. You can try again in about 5-15 minutes.</p>
      <h3>Low download speed</h3>
      <p>A simple check. Download the file from our server and via the telegram client.</p>
      <h3>Why do BitDefenderFalx and Trustlook flag our APK as Riskware or PUA?</h3>
      <p>Our APKs may be flagged by BitDefenderFalx as Android.Riskware.TestKey.rA and by Trustlook as
         Android.PUA.DebugKey because we use a debug key for signing.</p>
      <h3>Is the file I download from APKVISION safe?</h3>
      <p>Of course, every file is checked by antivirus software before being uploaded to the system.</p>
    </div>
    <div class="mainb">
      <div class="mainb-main-title">New Releases</div>
      <a href="/games/action/zad-archery-idle-rpg-131111/" class="mainb-item" id="post-131111">
        <img src="${ORIGIN}/img/icon.png" alt="Zad Archery">
        <div class="mainb-title">Zad Archery: Idle RPG</div><div class="mainb-cat">v1.0.4</div>
      </a>
      <a href="/games/action/apple-knight-3-131222/" class="mainb-item" id="post-131222">
        <img src="${ORIGIN}/img/icon.png" alt="Apple Knight 3">
        <div class="mainb-title">Apple Knight 3</div><div class="mainb-cat">v2.1.0</div>
      </a>
    </div>
    <footer class="site-footer">
      <a href="/app/tools/apkvision-store-131787/">Download APKVision Store</a> Our official app
      &copy; 2015 - 2026 <a href="https://apkvision.org/">APKVISION.ORG</a>
      <a href="/privacy-policy/">PRIVACY POLICY</a> <a href="/dmca/">DMCA</a> <a href="/contacts/">Contact</a>
    </footer>
    <div class="contact-modal">Insert You are going to send email to Send Move Comment Move</div>
</body></html>`;

/* --------- variant: label split over several <div>s + runaway anchor ------- */
const POST3 = {
  id: 130888,
  slug: "split-label-game-130888",
  link: `${ORIGIN}/games/action/split-label-game-130888/`,
  title: "Split Label Game APK",
  content: "<p>Label split across block elements.</p>",
  modified: "2026-09-08T08:00:00",
};

const detailRunawayVariant = (post, inner, version) => `<!doctype html><html><head>
  <meta property="og:image" content="${ORIGIN}/img/icon.png">
  <title>${post.title} Download ${version} free</title>
</head><body>
  <div class="ver-top">
    <div class="ver-top-h1"><h1>${post.title}</h1></div>
    <span class="ver-top-version">${version}</span>
  </div>
  <table class="appinfo">
    <tr><th>Version</th><td>${version}</td></tr>
    <tr><th>Genre</th><td><a href="/games/action/">Action</a></td></tr>
  </table>
  <p class="rating">Rating: 4.4/5 (321 votes)</p>
  <div class="dl-box">
  <a id="durl" class="fdl-btn downad" href="/games/action/${post.slug}/download/${version}-apk/" rel="nofollow" download>
    ${inner}
    <div class="dl-faq">
      <h2>Download FAQs</h2>
      <h3>Is the file I download from APKVISION safe?</h3>
      <p>Of course, every file is checked by antivirus software before being uploaded to the system.
         Our hosting server is also regularly checked to avoid any threats.</p>
    </div>
    <footer class="site-footer">&copy; 2015 - 2026 <a href="https://apkvision.org/">APKVISION.ORG</a>
      <a href="/privacy-policy/">PRIVACY POLICY</a> <a href="/dmca/">DMCA</a> <a href="/contacts/">Contact</a></footer>
    <div class="contact-modal">Insert You are going to send email to Send Move Comment Move</div>
</body></html>`;

const DETAIL_SPLIT_LABEL = detailRunawayVariant(
  POST3,
  `<div class="fdl-btn-title"><div>Download</div><div>APK &#8212; 1.10 GB</div>Split-Label-Game-v3.0-mod-apkvision.apk</div>`,
  "v3.0"
);

/* --------- variant: anchor text with no "Download …" line at all ----------- */
const POST4 = {
  id: 130777,
  slug: "no-label-game-130777",
  link: `${ORIGIN}/games/action/no-label-game-130777/`,
  title: "No Label Game APK",
  content: "<p>Anchor carries no button text.</p>",
  modified: "2026-09-08T08:00:00",
};

const DETAIL_NO_LABEL = detailRunawayVariant(
  POST4,
  `<div class="fdl-btn-title">No-Label-Game-v9.9-mod-apkvision.apk</div>
    <p class="dl-attention">Attention! This APK is designed for devices with an ARM64 CPU (AArch64, arm64-v8a).
       You won&#8217;t be able to install this modification on a device with a 32-bit processor.</p>
    <div class="dl-size">Size: 748.12 MB</div>`,
  "v9.9"
);

/* -------------------------- android ports (/ports/) ----------------------- */
// Deliberately uses a card class the parser does NOT know (`apk-port-card`)
// to prove the generic fallback works — like a future source template change.
const portCard = (href, title, badge, ver, imgHtml) => `
    <a href="${href}" class="apk-port-card">
      ${imgHtml}
      <span class="apk-port-card__name">${title}</span>
      ${badge ? `<span class="apk-port-card__badge">${badge}</span>` : ""}
      <span class="apk-port-card__ver">${ver}</span>
    </a>`;

const portsPage = (cards, loadMore) => `<!doctype html><html><head>
  <title>Android Ports – PC &amp; Console Games for Android | APKVision Mock</title>
</head><body>
  <h1>Android Ports</h1>
  <h2>Port catalog <span>4</span></h2>
  <div class="apk-ports-grid">
    ${cards}
  </div>
  ${loadMore ? `<a class="apk-ports-loadmore" href="${loadMore}">Load More</a>` : ""}
  <h2>Community wishlist</h2>
  <p>No reviewed suggestions yet</p>
</body></html>`;

const PORTS_1 = portsPage(
  [
    portCard("/games/god-of-war-chains-of-olympus-131663/", "God of War: Chains of Olympus", "Full", "v0.1.0", imgLazyDataSrc("God of War")),
    portCard("/games/adventure/the-elder-scrolls-v-skyrim-135179/", "The Elder Scrolls V: Skyrim", "Update • Full", "v0.25", imgSrcsetOnly("Skyrim")),
    portCard("/games/action/the-void-135280/", "The Void", "Full", "v0.2-dev", imgNoscript("The Void")),
  ].join(""),
  "/ports/page/2/"
);

const PORTS_2 = portsPage(
  portCard("/games/role-playing/lost-odyssey-135269/", "Lost Odyssey", "Full", "v1.1.0", imgEager("Lost Odyssey")),
  null
);

/* --------------------------- collections ---------------------------------- */

const COLLECTIONS = `<!doctype html><html><head><title>Collections | APKVision Mock</title></head><body>
  <h1>Collections</h1>
  <a class="collection-card" href="/collections/best-offline-games-for-android/">
    <span class="collection-card__count">3 games</span>
    <strong>Best Offline Games for Android</strong>
    <span>View more</span>
    <img src="${ORIGIN}/img/icon.png" alt="">
    <img src="${GIF_1PX}" data-src="${ORIGIN}/img/shot1.png" alt="" loading="lazy">
    <img src="${ORIGIN}/img/shot2.png" alt="">
    <img src="/img/icon.png" alt="">
  </a>
  <a class="collection-card" href="/collections/poppy-playtime/">
    <span class="collection-card__count">1 game</span>
    <strong>All parts of Poppy Playtime</strong>
    <span>View more</span>
    <img src="${GIF_1PX}" data-lazy-src="${ORIGIN}/img/icon.png" alt="" loading="lazy">
  </a>
</body></html>`;

const collectionGame = (rank, href, genre, title, rating, ratings, imgHtml) => `
    <a class="collection-game" href="${href}">
      <span class="collection-game__rank">${rank}</span>
      ${imgHtml}
      <span class="collection-game__genre">${genre}</span>
      <strong>${title}</strong>
      <span class="collection-game__rating">${rating}</span>
      <span>${ratings} ratings</span>
    </a>`;

const collectionDetail = (title, desc, count, entries) => `<!doctype html><html><head>
  <title>${title} | APKVision Mock</title>
  <meta name="description" content="${desc}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
</head><body>
  <main>
    <h1>${title}</h1>
    <p>${desc}</p>
    <h2>Games in this collection</h2>
    <span>${count}</span>
    <div class="collection-games">
      ${entries}
    </div>
    <p><strong>Community ranking</strong> 0 games</p>
  </main>
</body></html>`;

const COLLECTION_OFFLINE = collectionDetail(
  "Best Offline Games for Android",
  "Hand-picked Android games you can play without Wi-Fi or mobile data.",
  3,
  [
    collectionGame(1, "/games/role-playing/stardew-valley-40176/", "Role Playing", "Stardew Valley", "4.3", "1,402", imgEager("Stardew Valley")),
    collectionGame(2, "/games/action/dead-cells-apk-1-64455/", "Action", "Dead Cells", "4.3", "781", imgLazyDataSrc("Dead Cells")),
    collectionGame(3, "/games/role-playing/terraria-apk-51597/", "Role Playing", "Terraria", "4.4", "2,466", imgSrcsetOnly("Terraria")),
  ].join("")
);

const COLLECTION_POPPY = collectionDetail(
  "All parts of Poppy Playtime",
  "Every Poppy Playtime chapter for Android in one collection.",
  1,
  collectionGame(1, "/games/action/parahcuy-action-platformer-130581/", "Action", "Poppy Playtime Chapter 1", "4.5", "999", imgLazyDataSrc("Poppy Playtime"))
);

/* --------------------------------- server --------------------------------- */

const APK_FILE = Buffer.alloc(64 * 1024);
for (let i = 0; i < APK_FILE.length; i++) APK_FILE[i] = (i * 31) & 0xff;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, ORIGIN);
  const p = url.pathname;

  const send = (code, type, body) => {
    res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  };

  // Fake token endpoint mirroring the real /generate_token.php: the app's
  // /api/tg route POSTs {file_name, secret} here in dev, like the source
  // site's inline generateToken() does in the browser.
  if (p === "/generate_token.php" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => {
      body += c;
    });
    req.on("end", () => {
      try {
        const { file_name, secret } = JSON.parse(body || "{}");
        if (secret !== "zI7sDzI7sD6fid3432454qQ4u6qQ4u" || !file_name) {
          return send(200, "application/json", JSON.stringify({ error: "bad request" }));
        }
        let t = 0;
        for (let i = 0; i < file_name.length; i++) t = (t * 31 + file_name.charCodeAt(i)) >>> 0;
        return send(200, "application/json", JSON.stringify({ token: "mock_" + t.toString(36) }));
      } catch {
        return send(400, "application/json", JSON.stringify({ error: "bad json" }));
      }
    });
    return;
  }

  try {
    if (p === "/") return send(200, "text/html; charset=utf-8", HOME);
    if (p === "/games/" || p === "/games/action/") return send(200, "text/html; charset=utf-8", LISTING(p === "/games/" ? "Games" : "Action Games"));
    if (p === "/best-new-releases/" || p === "/popular-games/" || p === "/updated/" || p === "/top-100-games/")
      return send(200, "text/html; charset=utf-8", LISTING(p.replace(/^\//, "").replace(/-$|\/$/, "").replace(/-/g, " ")));
    if (p === "/games/action/parahcuy-action-platformer-130581/") return send(200, "text/html; charset=utf-8", DETAIL);
    if (p === "/games/action/parahcuy-action-platformer-130581/download/v1.3.2-apk/")
      return send(200, "text/html; charset=utf-8", DOWNLOAD_PAGE);
    if (p === "/games/action/gta-sa-v2-11-311-full-mod-money-130999/")
      return send(200, "text/html; charset=utf-8", DETAIL_RUNAWAY);
    if (p === "/games/action/split-label-game-130888/") return send(200, "text/html; charset=utf-8", DETAIL_SPLIT_LABEL);
    if (p === "/games/action/no-label-game-130777/") return send(200, "text/html; charset=utf-8", DETAIL_NO_LABEL);
    if (p === "/games/action/gta-sa-v2-11-311-full-mod-money-130999/download/v2.11.311-apk/")
      return send(
        200,
        "text/html; charset=utf-8",
        DOWNLOAD_PAGE.replace(/Parahcuy – Action Platformer/g, "GTA SA")
          .replace(/parahcuy-action-platformer/g, "gta-sa")
          .replace(/ParahCuy-v1\.3\.2-full-apkvision\.apk/g, "GTA-SA-v2.11.311-full-mod-money-apkvision.apk")
          .replace(/v1\.3\.2/g, "v2.11.311")
          .replace(/84\.89 MB/g, "2.46 GB")
      );
    if (p.startsWith("/dl/") && p.endsWith(".apk")) {
      res.writeHead(200, {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${p.split("/").pop()}"`,
        "Content-Length": APK_FILE.length,
      });
      return res.end(APK_FILE);
    }
    if (p === "/img/icon.png") return send(200, "image/png", ICON);
    if (p === "/img/shot1.png" || p === "/img/shot2.png") return send(200, "image/png", SHOT);

    const postJson = (post, excerpt) =>
      JSON.stringify({
        id: post.id,
        slug: post.slug,
        link: post.link,
        title: { rendered: post.title },
        content: { rendered: post.content },
        excerpt: { rendered: excerpt },
        modified: post.modified,
        categories: [3],
      });

    if (p === "/wp-json/wp/v2/posts/130581")
      return send(200, "application/json", postJson(POST, "<p>Platformer action 2D dengan kontrol halus.</p>"));
    if (p === "/wp-json/wp/v2/posts/130999")
      return send(200, "application/json", postJson(POST2, "<p>Open-world classic, fully modded.</p>"));
    if (p === "/wp-json/wp/v2/posts/130888")
      return send(200, "application/json", postJson(POST3, "<p>Label split across block elements.</p>"));
    if (p === "/wp-json/wp/v2/posts/130777")
      return send(200, "application/json", postJson(POST4, "<p>Anchor carries no button text.</p>"));
    if (p === "/wp-json/wp/v2/posts") {
      return send(
        200,
        "application/json",
        JSON.stringify([POST, POST2, POST3, POST4].map((post) => ({ link: post.link, modified: post.modified })))
      );
    }
    if (p === "/wp-json/wp/v2/search") {
      const q = (url.searchParams.get("search") || "").toLowerCase();
      const items = [POST, POST2, POST3, POST4]
        .filter((post) => q && post.title.toLowerCase().includes(q))
        .map((post) => ({ id: post.id, title: { rendered: post.title }, url: post.link }));
      return send(200, "application/json", JSON.stringify(items));
    }

    if (p === "/app/" || p === "/app/tools/") return send(200, "text/html; charset=utf-8", LISTING("Apps"));
    if (p === "/ports/") return send(200, "text/html; charset=utf-8", PORTS_1);
    if (p === "/ports/page/2/") return send(200, "text/html; charset=utf-8", PORTS_2);
    if (p === "/collections/") return send(200, "text/html; charset=utf-8", COLLECTIONS);
    if (p === "/collections/best-offline-games-for-android/")
      return send(200, "text/html; charset=utf-8", COLLECTION_OFFLINE);
    if (p === "/collections/poppy-playtime/") return send(200, "text/html; charset=utf-8", COLLECTION_POPPY);
    // generic post detail: any /games/...-<id>/ or /app/...-<id>/
    if (/^\/(games|app)\/(?:[\w-]+\/)?[\w-]+-\d+\/$/.test(p))
      return send(200, "text/html; charset=utf-8", DETAIL);
    // generic REST post (any id not handled above)
    const restM = p.match(/^\/wp-json\/wp\/v2\/posts\/(\d+)$/);
    if (restM) {
      const gid = parseInt(restM[1], 10);
      return send(
        200,
        "application/json",
        postJson(
          {
            id: gid,
            slug: `mock-game-${gid}`,
            link: `${ORIGIN}/games/action/mock-game-${gid}/`,
            title: `Mock Game ${gid} APK`,
            content: "<p>Generic mock post.</p>",
            modified: "2026-09-10T08:00:00",
          },
          "<p>Generic mock post.</p>"
        )
      );
    }

    return send(404, "text/html; charset=utf-8", "<html><body>404 not found</body></html>");
  } catch (e) {
    return send(500, "text/plain", String(e));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock-source] fake apkvision.org running at ${ORIGIN}`);
});
