// Englisch-App (public/englisch/, eigenständig neben Lernnest): startet ohne Fehler, eine ganze
// Tagesmission lässt sich durchspielen, der Stand bleibt nach dem Neuladen, nichts läuft seitlich über.
// Aufruf: node tools/e2e-englisch.mjs
import { starteServer, starteBrowser } from "./server.mjs";
import { pruefer } from "./lade.mjs";

const { ok, ende } = pruefer("Englisch-App");
const srv = await starteServer();
const b = await starteBrowser();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: "block" });
// Schriften kommen von Google Fonts; im Test nicht nötig
await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const page = await ctx.newPage();
const fehler = [];
page.on("pageerror", (e) => fehler.push("Seitenfehler: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) fehler.push("Konsole: " + m.text()); });

await page.goto(srv.url + "englisch/");
await page.waitForSelector("[data-a=startMission]");
ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "Startseite läuft seitlich nicht über");
ok((await page.textContent(".hero h2")).includes("Opening a meeting"), "erste Mission: Opening a meeting");

await page.click("[data-a=startMission]");
let schritte = 0, haengt = false;
while (schritte++ < 80) {
  if (await page.locator(".done-flame").count()) break;
  if (await page.locator(".phrase-card").count()) { await page.click("[data-a=next]"); continue; }
  if (await page.locator(".fb").count()) { await page.click(".fb ~ .foot [data-a=next]"); continue; }
  if (await page.locator("[data-a=bpick]").count()) {
    // Satzbau richtig lösen: Wörter in der Reihenfolge der Lösung antippen
    const idx = await page.evaluate(() => { const e = curItem().ex, used = []; return e.answer.map((w) => { const i = e.pool.findIndex((p, j) => p.w === w && !used.includes(j)); used.push(i); return i; }); });
    for (const i of idx) await page.click(`[data-a=bpick][data-i="${i}"]`);
    await page.click("[data-a=bcheck]"); continue;
  }
  if (await page.locator("[data-a=opt]:not([disabled])").count()) {
    const i = await page.evaluate(() => { const e = curItem().ex; return e.options.findIndex((o) => norm(o) === norm(e.answer)); });
    await page.locator("[data-a=opt]").nth(i).click(); continue;
  }
  if (await page.locator("[data-a=showModel]").count()) {
    await page.fill("#ans", "Good morning everyone, thanks for making the time today.");
    await page.click("[data-a=showModel]");
    await page.click("[data-a=rate][data-r=gut]"); continue;
  }
  haengt = true; break;
}
ok(!haengt, "Mission bleibt nirgends hängen");
ok(await page.locator(".done-flame").count() === 1, "Abschluss-Seite erscheint");
ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, "Mission läuft seitlich nicht über");
const stand = await page.evaluate(() => ({ serie: streak(), themen: S.topicsDone, karten: Object.keys(S.cards).length, richtig: R.correct, gesamt: R.answered }));
ok(stand.serie === 1, `Serie steht auf 1 (ist ${stand.serie})`);
ok(stand.themen.includes("open"), "Thema als erledigt gespeichert");
ok(stand.karten === 6, `sechs Wendungen in der Lernkartei (sind ${stand.karten})`);
ok(stand.richtig === stand.gesamt && stand.gesamt > 0, `alle Aufgaben richtig erkannt (${stand.richtig} von ${stand.gesamt})`);

await page.click(".foot [data-a=closeOv]");
await page.reload();
await page.waitForSelector(".hero");
ok((await page.textContent(".hero")).includes("Heute erledigt"), "nach dem Neuladen: Mission bleibt erledigt");
ok((await page.textContent(".streak-n")).trim() === "1", "nach dem Neuladen: Serie bleibt 1");
ok(await page.evaluate(() => localStorage.getItem("lernnest-v1") === null), "berührt den Lernnest-Spielstand nicht");

for (const tab of ["prep", "lib", "prog"]) {
  await page.click(`[data-tab=${tab}]`);
  ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390, `Ansicht «${tab}» läuft seitlich nicht über`);
}

ok(!fehler.length, "keine Fehler in der Konsole" + (fehler.length ? ": " + fehler.slice(0, 3).join(" | ") : ""));
await ctx.close(); await b.close(); await srv.stop();
ende();
