import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const name = process.argv[2];
const route = process.argv[3] || "/";
const clickBegin = process.argv[4] === "begin";
if (!name) {
  console.error("usage: shot-r4.mjs <name> [route] [begin]");
  process.exit(1);
}
const outDir = path.resolve("gauntlet/shots-r4");
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
page.setDefaultTimeout(30000);
const base = process.env.SHOT_BASE || "http://127.0.0.1:3470";
const resp = await page.goto(base + route, { waitUntil: "domcontentloaded" });
console.log("status", resp?.status());
await page.waitForTimeout(900);
if (clickBegin) {
  const btn = page.getByRole("button", { name: /Start answering|Begin/i });
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForTimeout(500);
  }
}
const dest = path.join(outDir, `${name}.png`);
await page.screenshot({ path: dest, fullPage: false });
console.log(dest, fs.statSync(dest).size);
await browser.close();
