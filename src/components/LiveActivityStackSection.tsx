import React from "react";
import styled from "styled-components";
import AccentWord from "./AccentWord";
import SectionEyebrow from "./SectionEyebrow";
import { useI18n } from "@/i18n/I18nProvider";
import { useMountEffect } from "@/hooks/useMountEffect";

/**
 * Lock-screen Live Activities, shown with the REAL widget renders: the
 * lock-screen goldens from the app's SwiftUI review suite (the same assets
 * the app's own onboarding shows), pixel-identical to the shipped widget.
 * The section only paints the lock-screen backdrop (notch, clock, date) and
 * the pile animation — the activity itself is never recreated in DOM.
 * Regenerate the webp goldens if the Live Activity design changes:
 * PackApp/assets/images/onboarding/live-activity-{flight,event}.webp.
 */
type ActivityKind = "flight" | "event";

const GOLDEN_ASPECT = 1116 / 466;

const toneGlow: Record<ActivityKind, string> = {
  flight: "rgba(240, 198, 45, 0.12)",
  event: "rgba(126, 211, 139, 0.12)",
};

type ActivityCard = {
  key: ActivityKind;
  src: string;
  alt: string;
  top: string;
  left: string;
  rotate: string;
};

const activityCards: readonly ActivityCard[] = [
  {
    key: "flight",
    src: "/images/live-activities/live-activity-flight.webp",
    alt: "Pack flight Live Activity with boarding countdown, leave-by time, drive time, and security wait",
    top: "0rem",
    left: "1%",
    rotate: "-5deg",
  },
  {
    key: "event",
    src: "/images/live-activities/live-activity-event.webp",
    alt: "Pack event Live Activity with start countdown, leave-by time, and venue",
    top: "8rem",
    left: "48%",
    rotate: "6deg",
  },
];

const localized = {
  en: {
    eyebrow: "Travel day",
    titlePrefix: "Travel, kept ",
    titleAccent: "current",
    microcopy:
      "Departure, arrival, and hotel check-in stay on the lock screen so you always know what happens next.",
    lockScreenDate: "Tuesday, March 10",
  },
  es: {
    eyebrow: "Día de viaje",
    titlePrefix: "Tu viaje, siempre ",
    titleAccent: "al día",
    microcopy:
      "Salida, llegada y check-in del hotel permanecen en la pantalla de bloqueo para que siempre sepas qué sigue.",
    lockScreenDate: "Martes, 10 de marzo",
  },
} as const;

const Section = styled.section`
  display: grid;
  gap: 1.25rem;
  padding: 0.5rem 0 4rem;

  @media (max-width: 860px) {
    gap: 1.7rem;
    padding: 1rem 0 4.6rem;
  }
`;

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: end;
  justify-content: space-between;

  @media (max-width: 860px) {
    gap: 1rem;
    padding: 0 0.25rem;
  }
`;

const Title = styled.h2`
  margin: 0;
  max-width: 10ch;
  font-size: clamp(2.3rem, 5vw, 4rem);
  font-weight: 800;
  line-height: 1;
`;

const Microcopy = styled.p`
  margin: 0;
  max-width: 28rem;
  color: rgba(247, 240, 227, 0.78);
  font-size: 0.98rem;
  line-height: 1.5;

  @media (max-width: 860px) {
    max-width: 100%;
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const Pile = styled.div`
  position: relative;
  min-height: 29rem;

  @media (max-width: 860px) {
    min-height: 44rem;
    padding: 0 0.35rem;
  }
`;

const Card = styled.article<{
  $visible: boolean;
  $index: number;
  $top: string;
  $left: string;
  $rotate: string;
}>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: min(31rem, calc(100% - 1rem));
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible, $rotate }) =>
    $visible
      ? `translate3d(0, 0, 0) rotate(${$rotate})`
      : `translate3d(0, -110px, 0) rotate(calc(${$rotate} - 7deg))`};
  transition:
    transform 760ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 420ms ease-out;
  transition-delay: ${({ $index }) => `${$index * 110}ms`};
  z-index: ${({ $index }) => 10 - $index};
  will-change: transform, opacity;

  @media (max-width: 860px) {
    left: 0;
    top: ${({ $index }) => `${$index * 21.5}rem`};
    width: 100%;
    transform: ${({ $visible }) =>
      $visible ? "translate3d(0, 0, 0) rotate(0deg)" : "translate3d(0, -70px, 0) rotate(0deg)"};
  }
`;

const LockScreenCropFrame = styled.div`
  width: min(100%, 393px);
  aspect-ratio: 393 / 326;
  border-radius: 34px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 28px 60px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  @media (max-width: 860px) {
    width: min(100%, 378px);
    border-radius: 32px;
  }
`;

const LockScreenCrop = styled.div<{ $kind: ActivityKind }>`
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0.9rem 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(circle at top center, ${({ $kind }) => toneGlow[$kind]}, transparent 24%),
    linear-gradient(180deg, rgba(42, 42, 42, 0.92) 0%, rgba(20, 20, 20, 1) 54%, rgba(9, 9, 9, 1) 100%);

  @media (max-width: 860px) {
    padding: 1rem 1.05rem 1.3rem;
  }
`;

const LockScreenNotch = styled.div`
  width: 126px;
  height: 34px;
  border-radius: 999px;
  background: rgba(5, 5, 5, 0.98);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

const LockScreenTime = styled.div`
  margin-top: 0.5rem;
  font-size: 3rem;
  font-weight: 300;
  line-height: 0.92;
  letter-spacing: -0.04em;
  color: rgba(255, 255, 255, 0.94);
`;

const LockScreenDate = styled.div`
  margin-top: 0.18rem;
  font-size: 0.84rem;
  color: rgba(255, 255, 255, 0.62);
  letter-spacing: 0.02em;
`;

const LockScreenActivityWrap = styled.div`
  margin-top: 0.95rem;
  width: 361px;

  @media (max-width: 860px) {
    margin-top: 1.15rem;
    width: min(100%, 340px);
  }
`;

const GoldenImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: ${GOLDEN_ASPECT};
  user-select: none;
  pointer-events: none;
`;

const LiveActivityStackSection: React.FC = () => {
  const { locale } = useI18n();
  const [visible, setVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const content = localized[locale];

  useMountEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  });

  return (
    <Section id="live-activity-pile" ref={sectionRef}>
      <Header>
        <SectionEyebrow index="01" label={content.eyebrow} />
        <Title>
          {content.titlePrefix}
          <AccentWord>{content.titleAccent}</AccentWord>.
        </Title>
        <Microcopy>{content.microcopy}</Microcopy>
      </Header>

      <Pile>
        {activityCards.map((card, index) => (
          <Card
            key={card.key}
            $visible={visible}
            $index={index}
            $top={card.top}
            $left={card.left}
            $rotate={card.rotate}
          >
            <LockScreenCropFrame>
              <LockScreenCrop $kind={card.key}>
                <LockScreenNotch />
                <LockScreenTime>9:41</LockScreenTime>
                <LockScreenDate>{content.lockScreenDate}</LockScreenDate>
                <LockScreenActivityWrap>
                  <GoldenImage src={card.src} alt={card.alt} loading="lazy" decoding="async" />
                </LockScreenActivityWrap>
              </LockScreenCrop>
            </LockScreenCropFrame>
          </Card>
        ))}
      </Pile>
    </Section>
  );
};

export default LiveActivityStackSection;
