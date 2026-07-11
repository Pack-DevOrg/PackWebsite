// Mirror of native derivation — if native rules change, update derivation.ts AND
// these expectations, then re-verify vs PackApp/manual-live-activity-review/*.png.
//
// Drift guard for the Live Activity lab's TS port of the native iOS derivation.
// These tests run the real builders over the canonical fixtures at the fixtures'
// own reference now, and lock the KEY derived display tokens we verified against
// the native review renders. If the port (or a native rule it mirrors) shifts a
// token, a test here fails and forces a conscious update + native re-check.

import {
  buildDynamicIslandModel,
  buildMetricBoxes,
  buildStatusBarModel,
} from './derivation';
import { LAB_FIXTURES, LAB_REFERENCE_NOW } from './fixtures';
import {
  conciseTimeRemaining,
  detailItemValue,
  detailLabeledValue,
} from './helpers';

const NOW = LAB_REFERENCE_NOW;

describe('flight_arrived', () => {
  const state = LAB_FIXTURES.flight_arrived;

  it('renders the baggage carousel as the compact trailing token with the landing-plane icon', () => {
    const island = buildDynamicIslandModel(state, NOW);
    expect(island.compactTrailingText).toBe('7');
    expect(island.compactLeadingSymbolName).toBe('plane-landing');
  });

  it('derives the baggage metric box value from the structured {sourceKey:"baggage"} record', () => {
    // Prove the structured lookup, not a hardcoded string: the record is
    // {sourceKey:'baggage',label:'Bag',value:'7'}.
    const records = state.primary.details;
    expect(detailItemValue(['baggage'], records)).toBe('7');
    expect(detailLabeledValue(['baggage'], records)).toBe('Bag 7');

    const boxes = buildMetricBoxes(state, NOW);
    const baggageBox = boxes.find((box) => box.kind === 'baggage');
    expect(baggageBox?.value).toBe('7');
  });

  it('builds a landed status bar that is fully progressed and finite', () => {
    const bar = buildStatusBarModel(state, NOW);
    expect(bar).not.toBeNull();
    expect(bar?.countdownCaption).toBe('Landed');
    expect(Number.isFinite(bar?.progressFraction)).toBe(true);
    expect(bar?.progressFraction).toBe(1);
  });
});

describe('flight_arrived_sparse', () => {
  const state = LAB_FIXTURES.flight_arrived_sparse;

  it('uses a short landed compact trailing token when baggage and weather are absent', () => {
    const island = buildDynamicIslandModel(state, NOW);
    expect(island.compactTrailingText).toBe('Landed');
    expect(island.compactTrailingText).not.toBe('ORD - Chicago');
  });
});

describe('flight_departure', () => {
  const state = LAB_FIXTURES.flight_departure;

  it('renders the gate as compact trailing with the takeoff-plane icon', () => {
    const island = buildDynamicIslandModel(state, NOW);
    expect(island.compactTrailingText).toBe('C12');
    expect(island.compactLeadingSymbolName).toBe('plane-takeoff');
  });

  it('renders the tight leave-by countdown token from the island target', () => {
    const island = buildDynamicIslandModel(state, NOW);
    // The leave-by override retargets the island countdown to leaveByAt (65m out).
    expect(island.countdownTargetAt).toBeDefined();
    expect(conciseTimeRemaining(island.countdownTargetAt as Date, NOW)).toBe('1h5m');
  });

  it('builds a travel status bar with a finite in-range progress fraction', () => {
    const bar = buildStatusBarModel(state, NOW);
    expect(bar?.mode).toBe('travel');
    expect(Number.isFinite(bar?.progressFraction)).toBe(true);
    expect(bar?.progressFraction).toBeGreaterThanOrEqual(0);
    expect(bar?.progressFraction).toBeLessThanOrEqual(1);
  });
});

describe('flight_arrival', () => {
  const state = LAB_FIXTURES.flight_arrival;

  it('builds a "Lands in" status bar with a finite in-range progress fraction', () => {
    const bar = buildStatusBarModel(state, NOW);
    expect(bar?.countdownCaption).toBe('Lands in');
    expect(Number.isFinite(bar?.progressFraction)).toBe(true);
    expect(bar?.progressFraction).toBeGreaterThanOrEqual(0);
    expect(bar?.progressFraction).toBeLessThanOrEqual(1);
  });

  it('produces the expected terminal metric boxes', () => {
    const boxes = buildMetricBoxes(state, NOW);
    expect(boxes.length).toBe(3);
    const terminalBox = boxes.find((box) => box.kind === 'terminal');
    expect(terminalBox?.title).toBe('Terminal 4');
    expect(terminalBox?.value).toBe('Gate C12');
  });
});

describe('generic_event', () => {
  const state = LAB_FIXTURES.generic_event;

  it('keeps the compact island left-only with the calendar icon', () => {
    const island = buildDynamicIslandModel(state, NOW);
    expect(island.compactTrailingText).toBeUndefined();
    expect(island.compactLeadingSymbolName).toBe('calendar');
  });

  it('keeps countdown primary without a duplicate absolute-time box', () => {
    // The absolute start time lives at the status slider trailing (endpoint
    // style); a second "At" tile was the same time twice on one card.
    const boxes = buildMetricBoxes(state, NOW);
    expect(boxes[0]?.title).toBe('Starts in');
    expect(boxes.some((box) => box.title === 'At')).toBe(false);
    expect(boxes.some((box) => box.title === 'Next in')).toBe(false);
  });
});
