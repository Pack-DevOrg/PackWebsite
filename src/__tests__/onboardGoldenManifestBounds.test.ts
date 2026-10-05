/** @jest-environment node */
import { readFileSync } from "fs";
import path from "path";

type Box = { x: number; y: number; w: number; h: number };
type Entry = { golden: string; bounds?: Record<string, Box> };

const root = path.join(__dirname, "..", "..", "e2e");
const manifest = JSON.parse(
  readFileSync(path.join(root, "onboard-golden-parity.manifest.json"), "utf8"),
);
const appGoldens = JSON.parse(
  readFileSync(
    path.join(root, "fixtures", "onboarding-goldens", "manifest.json"),
    "utf8",
  ),
) as { steps: Array<Record<string, any>> };

// website golden name -> app golden step
const APP_STEP: Record<string, string> = {
  "what-pack-does-1.png": "demo-first",
  "what-pack-does-2.png": "demo-present",
  "what-pack-does-3.png": "demo-message-stage",
  "connections.png": "connected-accounts",
  "welcome.png": "complete",
};

function entries(): Entry[] {
  const out: Entry[] = [];
  for (const s of manifest.shared) {
    if (s.pages) out.push(...s.pages);
    else out.push(s);
  }
  return out;
}

const KEYS = ["title", "body", "cta", "progress"] as const;

describe("onboard golden manifest bounds", () => {
  it("every step entry has title/body/cta/progress boxes", () => {
    for (const e of entries()) {
      expect(e.bounds).toBeDefined();
      for (const k of KEYS) {
        const b = e.bounds![k];
        expect(b).toBeDefined();
        for (const f of ["x", "y", "w", "h"] as const) {
          expect(typeof b[f]).toBe("number");
          expect(Number.isFinite(b[f])).toBe(true);
        }
      }
    }
  });

  it("bounds equal the app golden boxes of the same step", () => {
    for (const e of entries()) {
      const app = appGoldens.steps.find((s) => s.step === APP_STEP[e.golden]);
      if (!app || !app.progress?.bounds) continue;
      const pick = (b: any): Box => ({
        x: b.x,
        y: b.y,
        w: b.width,
        h: b.height,
      });
      expect(e.bounds!.title).toEqual(pick(app.titleBounds));
      expect(e.bounds!.body).toEqual(pick(app.bodyBounds));
      expect(e.bounds!.cta).toEqual(pick(app.cta.bounds));
      expect(e.bounds!.progress).toEqual(pick(app.progress.bounds));
    }
  });
});
