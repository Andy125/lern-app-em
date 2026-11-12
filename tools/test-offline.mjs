// Die App startet ohne Internet (Service Worker). Aufruf: node tools/test-offline.mjs
import { starteServer, starteBrowser } from "./server.mjs";
import { pruefer } from "./helfer.mjs";

const { ok, ende } = pruefer("Offline");
const srv = await starteServer();
const b = await starteBrowser();
const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } });
const page = await ctx.newPage();
const fehler = [];
page.on("pageerror", (e) => fehler.push(e.message));
await page.goto(srv.url);
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
ok(await page.evaluate(() => !!navigator.serviceWorker.controller), "Service Worker steuert die Seite");
await ctx.setOffline(true);
await page.reload();
ok((await page.textContent("#app")).includes("Wie heißt du"), "App startet offline");
ok((await page.textContent("#version")).includes("Version"), "Versionsnummer auch offline");
await page.fill("#name", "Offline"); await page.click("[data-act=w-name]");
ok(await page.locator(".tierwahl").count() === 1, "offline weiter bedienbar");
ok(fehler.length === 0, "keine Seitenfehler: " + fehler.join(" | "));
await ctx.close(); await b.close(); await srv.stop();
ende();
