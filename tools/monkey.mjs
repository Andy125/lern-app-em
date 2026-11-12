// Zufälliges Durchklicken: tippt wild auf alles Tippbare und prüft, dass nichts kaputtgeht.
// Aufruf: node tools/monkey.mjs [schritte] [startwert]
import { oeffne, einrichten, stand, pruefer } from "./helfer.mjs";

const SCHRITTE = Number(process.argv[2] || 300), START = Number(process.argv[3] || 1);
const { ok, ende } = pruefer("Durchklicken");
let z = START >>> 0;
const zufall = (n) => { z = (Math.imul(z, 1103515245) + 12345) >>> 0; return z % n; };
const { page, fehler, zu } = await oeffne({ test: { pauseMs: 50 } });
await einrichten(page);
await page.evaluate(() => { window.__LN.stand().muenzen = 500; window.__LN.speichern(); });
for (let i = 0; i < SCHRITTE; i++) {
  const ziele = await page.evaluate(() => [...document.querySelectorAll("[data-act]:not([disabled])")].filter((e) => !["reset-ja", "sicherung"].includes(e.dataset.act)).length);
  if (!ziele) { await page.waitForTimeout(80); continue; }
  const k = zufall(ziele);
  await page.evaluate((k) => [...document.querySelectorAll("[data-act]:not([disabled])")].filter((e) => !["reset-ja", "sicherung"].includes(e.dataset.act))[k].dispatchEvent(new MouseEvent("click", { bubbles: true })), k);
  if (zufall(10) === 0 && (await page.locator("#eingabe:not([disabled])").count())) await page.fill("#eingabe", ["", "abc", "12", "Blüte", " "][zufall(5)]);
  if (zufall(40) === 0) await page.evaluate(() => window.__LN.speichern());
  if (fehler.length) break;
}
const s = await stand(page);
ok(fehler.length === 0, "keine Fehler beim wilden Tippen: " + fehler.slice(0, 3).join(" | "));
ok(Number.isFinite(s.muenzen) && s.muenzen >= 0, "Münzen gültig");
ok(JSON.stringify(await page.evaluate(() => window.LN.migrate(JSON.parse(localStorage.getItem("lernnest-v1"))))) === JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem("lernnest-v1")))), "gespeicherter Stand ist gültig");
await zu();
ende();
