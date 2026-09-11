/**
 * Regression test for lib/fileMeta.ts — run with:  node scripts/check-file-meta.mjs
 *
 * The source download page is minified: the file-info block, the download
 * button, the FAQ and the footer all sit on ONE line. A "rest of the line"
 * scrape then swallowed the whole page into the Size value, which exploded the
 * "Download APK — <size>" button. These fixtures lock that behaviour down.
 */
import assert from "node:assert/strict";
import { parseFileMeta } from "../lib/fileMeta.ts";

/* 1. minified page — everything after "Size:" on the same line (the bug) */
const MINIFIED = `<div class="dl-box"><p><b>Filename:</b> GTA-SA-v2.11.311-full-mod-money-apkvision.apk</p><p><b>Version:</b> v2.11.311</p><p><b>Processor:</b> arm64-v8a</p><p><b>Size:</b> 2.46 GB</p><a id="durl" class="fdl-btn downad" href="https://dl.apkvision.org/grand-theft-auto-san-andreas/GTA-SA-v2.11.311-full-mod-money-apkvision.apk" rel="nofollow noopener" download><div class="fdl-btn-title"><div>Download  APK</div>GTA-SA-v2.11.311-full-mod-money-apkvision.apk</div></a><button id="telega" onclick="generateToken('grand-theft-auto-san-andreas/GTA-SA-v2.11.311-full-mod-money-apkvision.apk')"><div class="fdl-btn-title"><div>Download from Telegram Bot</div>GTA-SA-v2.11.311-full-mod-money-apkvision.apk</div></button><p><b>Attention!</b> This APK is designed for devices with an ARM64 CPU (AArch64, arm64-v8a). You won't be able to install this modification on a device with a 32-bit processor.</p><p>Can't download file? <a href="#comments">Send Report</a></p><h2>Download FAQs</h2><p>Why does Virustotal detect our APK as potentially unwanted or suspicious? We use obfuscation to protect the modifications we've made to the APK files.</p><p>Low download speed A simple check. Download the file from our server and via the telegram client, if the download speed via telegram is low, then there is a problem with your Internet or device!</p><div class="footer">New Releases Zad Archery: Idle RPG Apple Knight 3 &copy; 2015 - 2026 APKVISION.ORG PRIVACY POLICY DMCA Contact Insert You are going to send email to Send Move Comment Move</div></div>`;

const min = parseFileMeta(MINIFIED);
assert.equal(min.filename, "GTA-SA-v2.11.311-full-mod-money-apkvision.apk");
assert.equal(min.version, "v2.11.311");
assert.equal(min.arch, "arm64-v8a");
assert.equal(min.size, "2.46 GB");
// no page prose may leak into any value
for (const [key, value] of Object.entries(min)) {
  assert.ok(value.length <= 64, `${key} is too long (${value.length} chars)`);
  assert.ok(!/Attention|Download FAQs|New Releases|Send Report|Send Move/i.test(value), `${key} leaked page text: ${value}`);
}

/* 2. pretty-printed page — one label per line (must still work) */
const PRETTY = `<div>
  <p><b>Filename:</b> ParahCuy-v1.3.2-full-apkvision.apk</p>
  <p><b>Version:</b> v1.3.2</p>
  <p><b>Processor:</b> armeabi-v7a</p>
  <p><b>Size:</b> 57 MB</p>
</div>`;
assert.deepEqual(parseFileMeta(PRETTY), {
  filename: "ParahCuy-v1.3.2-full-apkvision.apk",
  version: "v1.3.2",
  arch: "armeabi-v7a",
  size: "57 MB",
});

/* 3. page where Size has no size-shaped value -> empty, never prose */
const NO_SIZE = `<div><p><b>Filename:</b> Some-Game-v1.0-apkvision.apk</p><p><b>Version:</b> v1.0</p><p><b>Size:</b> coming soon, please check back later because our server is still syncing the file to the CDN right now</p></div>`;
const noSize = parseFileMeta(NO_SIZE);
assert.equal(noSize.filename, "Some-Game-v1.0-apkvision.apk");
assert.equal(noSize.version, "v1.0");
assert.equal(noSize.size, "");

console.log("check-file-meta: all assertions passed ✅");
