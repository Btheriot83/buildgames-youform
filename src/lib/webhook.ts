/**
 * Optional outbound webhook on form submit.
 * If WEBHOOK delivery fails, the response is still saved locally (degraded mode).
 */
export type WebhookResult =
  | { attempted: false; reason: "no_url" }
  | { attempted: true; ok: true; status: number }
  | { attempted: true; ok: false; error: string };

export async function deliverWebhook(
  url: string | null | undefined,
  payload: {
    event: "form.response.created";
    formId: string;
    formSlug: string;
    responseId: string;
    answers: Record<string, unknown>;
    submittedAt: string;
  }
): Promise<WebhookResult> {
  if (!url) {
    return { attempted: false, reason: "no_url" };
  }

  const timeoutMs = Number(process.env.WEBHOOK_TIMEOUT_MS || 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EmberForms/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        attempted: true,
        ok: false,
        error: `HTTP ${res.status}`,
      };
    }
    return { attempted: true, ok: true, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed";
    return { attempted: true, ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
