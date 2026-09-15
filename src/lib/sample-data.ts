import { createForm, createResponse, getMeta, setMeta, listForms } from "./forms";
import type { AppDatabase } from "./db";

const SAMPLE_FLAG = "sample_seeded_v1";

/** Idempotent sample forms — clearly labelled SAMPLE and safe to delete. */
export function ensureSampleData(db?: AppDatabase): void {
  if (getMeta(SAMPLE_FLAG, db) === "1") {
    return;
  }
  if (listForms(db).length > 0) {
    setMeta(SAMPLE_FLAG, "1", db);
    return;
  }

  const intake = createForm(
    {
      title: "[SAMPLE] Studio intake",
      description:
        "Sample conversational form — delete anytime. Mimics a client onboarding chat.",
      slug: "sample-studio-intake",
      webhook_url: null,
      schema: {
        thankYouMessage:
          "Got it. We'll read this before our call — thanks for the clarity.",
        fields: [
          {
            id: "f_name",
            type: "text",
            label: "Who are we speaking with?",
            required: true,
            placeholder: "Full name",
          },
          {
            id: "f_email",
            type: "email",
            label: "Best email for follow-up?",
            required: true,
            placeholder: "you@studio.example",
          },
          {
            id: "f_project",
            type: "select",
            label: "What kind of project is this?",
            required: true,
            options: ["Brand system", "Product UI", "Editorial site", "Other"],
          },
          {
            id: "f_budget",
            type: "number",
            label: "Rough budget band (USD, thousands)?",
            description: "A number is fine — e.g. 25 for ~$25k.",
            required: false,
            placeholder: "25",
          },
          {
            id: "f_notes",
            type: "textarea",
            label: "Anything else we should know?",
            required: false,
            placeholder: "Timeline, constraints, references…",
          },
          {
            id: "f_ready",
            type: "boolean",
            label: "Ready to start within 30 days?",
            required: true,
          },
        ],
      },
    },
    db
  );

  createResponse(
    intake.id,
    {
      f_name: "Avery Chen",
      f_email: "avery@example.com",
      f_project: "Product UI",
      f_budget: 40,
      f_notes: "[SAMPLE] Looking for a quiet redesign — no purple gradients.",
      f_ready: true,
    },
    db
  );

  createResponse(
    intake.id,
    {
      f_name: "Jordan Blake",
      f_email: "jordan@example.org",
      f_project: "Editorial site",
      f_budget: 18,
      f_notes: "[SAMPLE] Quarterly magazine archive.",
      f_ready: false,
    },
    db
  );

  createForm(
    {
      title: "[SAMPLE] Event RSVP",
      description: "Short sample RSVP — delete anytime.",
      slug: "sample-event-rsvp",
      schema: {
        thankYouMessage: "You're on the list. See you there.",
        fields: [
          {
            id: "f_guest",
            type: "text",
            label: "Name on the guest list?",
            required: true,
          },
          {
            id: "f_plus",
            type: "boolean",
            label: "Bringing a plus-one?",
            required: true,
          },
          {
            id: "f_diet",
            type: "select",
            label: "Meal preference?",
            required: true,
            options: ["Omnivore", "Vegetarian", "Vegan", "Other"],
          },
        ],
      },
    },
    db
  );

  setMeta(SAMPLE_FLAG, "1", db);
}
