import {
  createForm,
  createResponse,
  deleteForm,
  getFormBySlug,
  getMeta,
  setMeta,
  listForms,
} from "./forms";
import type { AppDatabase } from "./db";

const SAMPLE_FLAG = "sample_seeded_v3";
const LEGACY_SLUGS = [
  "sample-studio-intake",
  "sample-event-rsvp",
  "studio-intake",
  "event-rsvp",
  "az-diesel-intake",
  "mesa-yard-walk",
];

function wipeLegacyDemos(db?: AppDatabase): void {
  for (const slug of LEGACY_SLUGS) {
    const form = getFormBySlug(slug, db);
    if (form) deleteForm(form.id, db);
  }
  for (const form of listForms(db)) {
    if (/^\[?SAMPLE\]?/i.test(form.title) || /^(Studio intake|Event RSVP)$/i.test(form.title)) {
      deleteForm(form.id, db);
    }
  }
}

/** Idempotent demo letters — believable AZ / diesel / ops, never labelled SAMPLE. */
export function ensureSampleData(db?: AppDatabase): void {
  if (getMeta(SAMPLE_FLAG, db) === "1") {
    return;
  }

  wipeLegacyDemos(db);

  // If non-demo user forms remain, keep them and still ensure demo clipboard exists.
  if (getFormBySlug("az-diesel-intake", db)) {
    setMeta(SAMPLE_FLAG, "1", db);
    return;
  }

  const diesel = createForm(
    {
      title: "Mobile diesel intake — Valley runs",
      description:
        "Phoenix · Mesa · Gilbert. Tell us the unit and where it’s sitting. We’ll text when the truck is rolling.",
      slug: "az-diesel-intake",
      webhook_url: null,
      schema: {
        thankYouMessage:
          "Got it. Dispatch has your note — expect a text from the Mesa yard within the hour if it’s a roadside.",
        fields: [
          {
            id: "f_who",
            type: "text",
            label: "Who’s calling this in?",
            required: true,
            placeholder: "Name + company",
          },
          {
            id: "f_phone",
            type: "text",
            label: "Best cell for the tech?",
            required: true,
            placeholder: "(480) 555-0142",
          },
          {
            id: "f_unit",
            type: "text",
            label: "Unit / plate / VIN last 6?",
            required: true,
            placeholder: "Unit 17 · AZ 3AB224",
          },
          {
            id: "f_symptom",
            type: "select",
            label: "What’s the unit doing?",
            required: true,
            options: [
              "No-start / won’t crank",
              "Derate / limp mode",
              "DEF / aftertreatment",
              "Air leak / brakes",
              "Other road call",
            ],
          },
          {
            id: "f_where",
            type: "textarea",
            label: "Where is it sitting?",
            description:
              "Yard address, mile marker, or cross streets — Maricopa County preferred.",
            required: true,
            placeholder: "e.g. Love’s #305, I-10 exit 162, west lot · Gilbert",
          },
          {
            id: "f_urgent",
            type: "boolean",
            label: "Driver waiting on-site right now?",
            required: true,
          },
        ],
      },
    },
    db
  );

  createResponse(
    diesel.id,
    {
      f_who: "Rosa Delgado · Southwest Freight",
      f_phone: "(602) 555-0198",
      f_unit: "Unit 44 · AZ 8KX119",
      f_symptom: "Derate / limp mode",
      f_where: "Walmart DC yard, 6800 W Lower Buckeye Rd, Phoenix — gate 3",
      f_urgent: true,
    },
    db
  );

  createResponse(
    diesel.id,
    {
      f_who: "Mike Harlan · Harlan Ag",
      f_phone: "(480) 555-0177",
      f_unit: "Case IH Magnum · last6 492811",
      f_symptom: "No-start / won’t crank",
      f_where: "Field edge, Baseline & Meridian, Mesa — dirt pull-out south of canal",
      f_urgent: false,
    },
    db
  );

  createResponse(
    diesel.id,
    {
      f_who: "Tasha Nguyen · Desert Linehaul",
      f_phone: "(623) 555-0133",
      f_unit: "Peterbilt 579 · AZ 2MP441",
      f_symptom: "DEF / aftertreatment",
      f_where: "Pilot Flying J, I-17 exit 215, northbound Phoenix",
      f_urgent: true,
    },
    db
  );

  const yard = createForm(
    {
      title: "Saturday yard walk — Mesa shop",
      description:
        "Optional walk-through for fleet managers. Coffee at 8:00a, boots on by 8:20.",
      slug: "mesa-yard-walk",
      schema: {
        thankYouMessage: "You’re on the list. Gate code texts Friday afternoon.",
        fields: [
          {
            id: "f_guest",
            type: "text",
            label: "Name on the gate list?",
            required: true,
            placeholder: "First and last",
          },
          {
            id: "f_fleet",
            type: "text",
            label: "Fleet or shop you represent?",
            required: true,
            placeholder: "e.g. Copper State Logistics",
          },
          {
            id: "f_plus",
            type: "boolean",
            label: "Bringing a second person?",
            required: true,
          },
          {
            id: "f_focus",
            type: "select",
            label: "What do you want to see first?",
            required: true,
            options: [
              "Mobile service bays",
              "Parts cage / common fails",
              "Aftertreatment bench",
              "Just coffee & intros",
            ],
          },
        ],
      },
    },
    db
  );

  createResponse(
    yard.id,
    {
      f_guest: "Elena Ortiz",
      f_fleet: "Sun Corridor Carriers",
      f_plus: true,
      f_focus: "Aftertreatment bench",
    },
    db
  );

  createResponse(
    yard.id,
    {
      f_guest: "Drew Patel",
      f_fleet: "Patel Ready-Mix (ops)",
      f_plus: false,
      f_focus: "Mobile service bays",
    },
    db
  );

  setMeta(SAMPLE_FLAG, "1", db);
}
