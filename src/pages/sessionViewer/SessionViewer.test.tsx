import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SessionViewer, STALE_AFTER_MS, VIEWER_COPY } from "./SessionViewer";
import { frameBatchBecauseBody, type FrameBatch } from "./sessionFrames";
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
