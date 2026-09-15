import { test, expect } from "@playwright/test";

test("core loop: desk → public form → submit → responses visible", async ({
  page,
  request,
}) => {
  const slug = `e2e-smoke-${Date.now()}`;
  const create = await request.post("/api/forms", {
    data: {
      title: "E2E Smoke Form",
      slug,
      description: "Automated smoke",
      schema: {
        thankYouMessage: "Smoke complete",
        fields: [
          { id: "f_name", type: "text", label: "Your name?", required: true },
          { id: "f_ok", type: "boolean", label: "All good?", required: true },
        ],
      },
    },
  });
  if (!create.ok()) {
    throw new Error(`create failed ${create.status()}: ${await create.text()}`);
  }
  const { form } = await create.json();

  await page.goto(`/f/${form.slug}`);
  await expect(page.getByRole("heading", { name: "E2E Smoke Form" })).toBeVisible();
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByLabel("Your name?").fill("Smoke Tester");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Yes" }).click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Sealed." })).toBeVisible();

  const list = await request.get(`/api/forms/${form.id}/responses`);
  expect(list.ok()).toBeTruthy();
  const body = await list.json();
  expect(body.responses.length).toBeGreaterThanOrEqual(1);
  expect(body.responses[0].answers.f_name).toBe("Smoke Tester");

  const csv = await request.get(`/api/forms/${form.id}/export?format=csv`);
  expect(csv.ok()).toBeTruthy();
  const csvText = await csv.text();
  expect(csvText).toContain("Smoke Tester");
});
