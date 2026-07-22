import styled from "styled-components";

/**
 * The Day-of phone: a lock screen carrying the REAL flight Live Activity —
 * the lock-screen golden from the app's SwiftUI review suite, pixel-identical
 * to the shipped widget. Only the lock-screen backdrop (notch, clock, date)
 * is painted here; the activity itself is never recreated in DOM.
 */
const Frame = styled.div`
  width: 100%;
  aspect-ratio: 1206 / 2622;
  border-radius: 2.2rem;
  border: 1px solid rgba(243, 210, 122, 0.22);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.7rem 1rem 1rem;
  background:
    radial-gradient(circle at top center, rgba(240, 198, 45, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(42, 42, 42, 0.92) 0%, rgba(20, 20, 20, 1) 46%, rgba(9, 9, 9, 1) 100%);
  box-shadow:
    0 0 90px rgba(243, 210, 122, 0.1),
    0 24px 70px rgba(0, 0, 0, 0.55);
`;

const Notch = styled.div`
  width: 38%;
  height: 1.6rem;
  border-radius: 999px;
  background: rgba(5, 5, 5, 0.98);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
`;

const LockTime = styled.div`
  margin-top: 1.6rem;
  font-size: 3.6rem;
  font-weight: 300;
  line-height: 0.92;
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.94);
`;

const LockDate = styled.div`
  margin-top: 0.3rem;
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.62);
  letter-spacing: 0.02em;
`;

const GoldenImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1116 / 466;
  margin-top: 1.4rem;
  user-select: none;
  pointer-events: none;
`;

export default function LiveActivityPhone() {
  return (
    <Frame>
      <Notch />
      <LockTime>9:41</LockTime>
      <LockDate>Tuesday, March 10</LockDate>
      <GoldenImage
        src="/images/live-activities/live-activity-flight.webp"
        alt="Pack flight Live Activity on the Lock Screen: boarding countdown, leave-by time, drive time, and security wait"
        loading="lazy"
        decoding="async"
      />
    </Frame>
  );
}
