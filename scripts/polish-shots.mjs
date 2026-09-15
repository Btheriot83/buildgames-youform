import { chromium } from "@playwright/test";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "polish-shots");
fs.mkdirSync(out, { recursive: true });

const env = { ...process.env, DATABASE_PATH: "data/youform.db", PORT: "3000" };
const server = spawn("npm", ["run", "start"], { cwd: root, env, stdio: "pipe" });

async function waitReady() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch("http://127.0.0.1:3000/");
      if (r.ok || r.status === 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server not ready");
}

try {
  await waitReady();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  await page.goto("http://127.0.0.1:3000/");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/01-desk.png`, fullPage: true });
  await page.goto("http://127.0.0.1:3000/f/sample-studio-intake");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/02-public-intro.png`, fullPage: true });
  await page.getByRole("button", { name: "Begin" }).click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/03-question.png`, fullPage: true });
  await browser.close();
  console.log("shots", fs.readdirSync(out));
} finally {
  server.kill("SIGTERM");
}
