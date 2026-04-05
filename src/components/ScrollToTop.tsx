import React, { useState } from "react";
import styled from "styled-components";
import { ArrowUp } from "lucide-react";
import { useMountEffect } from "@/hooks/useMountEffect";

const ScrollButton = styled.button`
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(249, 47, 96, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(249, 47, 96, 0.3);
  transition: opacity 160ms ease-out, transform 160ms ease-out,
    background-color 160ms ease-out, box-shadow 160ms ease-out;

  opacity: 0;
  pointer-events: none;
  transform: translateY(16px) scale(0.92);

  &[data-visible="true"] {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  &:hover {
    background: rgba(249, 47, 96, 1);
    transform: translateY(0) scale(1.06);
    box-shadow: 0 12px 40px rgba(249, 47, 96, 0.5);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    bottom: var(--space-3);
    right: var(--space-3);
    width: 44px;
    height: 44px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

const ProgressRing = styled.svg`
  position: absolute;
  top: -2px;
  left: -2px;
  width: 52px;
  height: 52px;
  transform: rotate(-90deg);

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
  }
`;

const ProgressCircle = styled.circle<{ $progress: number }>`
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 2;
  stroke-dasharray: 150.8; /* 2 * π * 24 */
  stroke-dashoffset: ${(props) => 150.8 - (props.$progress * 150.8) / 100};
  transition: stroke-dashoffset 0.3s ease;
`;

const ArrowWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: packArrowBounce 2s ease-in-out infinite;

  @keyframes packArrowBounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ScrollToTop: React.FC = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useMountEffect(() => {
    let animationFrameId: number | null = null;

    const onScroll = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;

        setScrollProgress(Math.min(progress, 100));
        setIsVisible(scrolled > 300);
        animationFrameId = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ScrollButton
      onClick={scrollToTop}
      aria-label="Scroll to top"
      data-visible={isVisible ? "true" : "false"}
    >
      <ProgressRing>
        <ProgressCircle cx="26" cy="26" r="24" $progress={scrollProgress} />
      </ProgressRing>
      <ArrowWrap>
        <ArrowUp />
      </ArrowWrap>
    </ScrollButton>
  );
});

export default ScrollToTop;
