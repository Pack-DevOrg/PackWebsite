import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SessionViewer, STALE_AFTER_MS, VIEWER_COPY } from "./SessionViewer";
import { frameBatchBecauseBody, type FrameBatch, type TimelineIndex } from "./sessionFrames";
import { ThemeProvider } from "@/styles/ThemeProvider";

function batch(n = 2): FrameBatch {
  return {
    frames: Array.from({ length: n }, (_, i) => ({ capturedAtMs: 1000 + i * 10, jpegBase64: `QUJD${i}` })),
    viewport: { width: 400, height: 800 },
    masked: true,
    batchMs: 300,
  };
}

function renderViewer(props: Partial<React.ComponentProps<typeof SessionViewer>> = {}) {
  const sendTouch = jest.fn().mockResolvedValue(undefined);
  const onDone = jest.fn();
  render(
    <ThemeProvider>
      <SessionViewer
        fetchBatch={props.fetchBatch ?? (() => new Promise(() => undefined))}
        sendTouch={props.sendTouch ?? sendTouch}
        onDone={onDone}
        doneBusy={false}
        onStats={props.onStats}
        timeline={props.timeline}
      />
    </ThemeProvider>,
  );
  return { sendTouch, onDone };
}

describe("frameBatchBecauseBody", () => {
  it("accepts only masked batches, bare or in the api envelope", () => {
    expect(frameBatchBecauseBody({ success: true, data: batch() })).not.toBeNull();
    expect(frameBatchBecauseBody(batch())).not.toBeNull();
    expect(frameBatchBecauseBody({ ...batch(), masked: false })).toBeNull();
    expect(frameBatchBecauseBody({ ...batch(), frames: [] })).toBeNull();
  });
});

describe("SessionViewer", () => {
  it("plays the frames and reports the rate", async () => {
    const onStats = jest.fn();
    const fetchBatch = jest.fn().mockResolvedValueOnce(batch(3)).mockImplementation(() => new Promise(() => undefined));
    renderViewer({ fetchBatch, onStats });
    await waitFor(() => expect(screen.getByAltText("Pack's browser").getAttribute("src")).toContain("QUJD2"));
    expect(onStats).toHaveBeenCalledWith(expect.objectContaining({ batchMs: 300 }));
  });

  it("a tap sends fractions of the picture, not pixels", async () => {
    const fetchBatch = jest.fn().mockResolvedValueOnce(batch(1)).mockImplementation(() => new Promise(() => undefined));
    const { sendTouch } = renderViewer({ fetchBatch });
    const img = await screen.findByAltText("Pack's browser");
    img.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 400, right: 210, bottom: 420, x: 10, y: 20, toJSON: () => ({}) });
    fireEvent.click(img, { clientX: 110, clientY: 220 });
    expect(sendTouch).toHaveBeenCalledWith({ type: "pointer", action: "tap", x: 0.5, y: 0.5 });
  });

  it("typed text goes to the page as a key event", async () => {
    const { sendTouch } = renderViewer();
    fireEvent.change(screen.getByLabelText(VIEWER_COPY.type), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: VIEWER_COPY.send }));
    expect(sendTouch).toHaveBeenCalledWith({ type: "key", text: "hello" });
  });

  it("says the picture is stale, then lost after repeated failures", async () => {
    jest.useFakeTimers();
    try {
      renderViewer({ fetchBatch: () => Promise.reject(new Error("net")) });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(STALE_AFTER_MS + 4000);
      });
      expect(screen.getByTestId("session-viewer").getAttribute("data-health")).toBe("lost");
      expect(screen.getByRole("status")).toHaveTextContent(VIEWER_COPY.lost);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("SessionViewer timeline scrub", () => {
  const index: TimelineIndex = {
    version: 1,
    jobId: "j",
    ended: false,
    tracks: [
      { trackId: "t1", label: "shop.example.com", firstTs: 1, frames: 2 },
      { trackId: "t2", label: "pay.example.org", firstTs: 2, frames: 1 },
    ],
    frames: [
      { trackId: "t1", seq: 1, ts: 1000, host: "shop.example.com", stepId: "1", bytes: 10 },
      { trackId: "t1", seq: 2, ts: 2000, host: "shop.example.com", stepId: "2", bytes: 10 },
      { trackId: "t2", seq: 1, ts: 1500, host: "pay.example.org", stepId: "2", bytes: 10 },
    ],
  };
  const timeline = (fetchFrame: jest.Mock) => ({ fetchIndex: jest.fn().mockResolvedValue(index), fetchFrame });

  it("shows tracks as separate tabs and scrubs one track at a time", async () => {
    const fetchFrame = jest.fn().mockImplementation(async (track: string, seq: number) => `data:image/jpeg;base64,${track}${seq}`);
    renderViewer({ timeline: timeline(fetchFrame) });
    expect(await screen.findByRole("tab", { name: "shop.example.com" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "pay.example.org" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Scrub through what Pack did"), { target: { value: "1" } });
    await waitFor(() => expect(screen.getByAltText("Pack's browser, earlier").getAttribute("src")).toContain("t12"));
    expect(fetchFrame).toHaveBeenCalledWith("t1", 2, expect.anything());
    fireEvent.click(screen.getByRole("tab", { name: "pay.example.org" }));
    await waitFor(() => expect(screen.getByAltText("Pack's browser, earlier").getAttribute("src")).toContain("t21"));
    expect(screen.getByText(/pay\.example\.org · step 2/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to live" }));
    expect(screen.queryByAltText("Pack's browser, earlier")).toBeNull();
  });

  it("replays the last recorded frame when the live session is gone", async () => {
    jest.useFakeTimers();
    try {
      const fetchFrame = jest.fn().mockResolvedValue("data:image/jpeg;base64,LAST");
      renderViewer({ fetchBatch: () => Promise.reject(new Error("gone")), timeline: timeline(fetchFrame) });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(5000);
      });
      await waitFor(() => expect(screen.getByAltText("Pack's browser, earlier").getAttribute("src")).toContain("LAST"));
      expect(fetchFrame).toHaveBeenCalledWith("t1", 2, expect.anything());
    } finally {
      jest.useRealTimers();
    }
  });
});
