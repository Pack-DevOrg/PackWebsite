import React, { Suspense, startTransition, useMemo, useRef, useState } from "react";
import { useMountEffect } from "@/hooks/useMountEffect";

const importWaitlistForm = () => import("./WaitlistForm");
const WaitlistForm = React.lazy(importWaitlistForm);

type IdleWindowLike = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const scheduleIdleLoad = (
  callback: () => void,
  delayMs: number,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const idleWindow = window as IdleWindowLike;

  if (typeof idleWindow.requestIdleCallback === "function") {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: delayMs });
    return () => {
      if (typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, delayMs);
  return () => window.clearTimeout(timeoutId);
};

const shouldAutoLoadHeroForm = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.matchMedia("(max-width: 739px)").matches) {
    return false;
  }

  const navigatorWithConnection = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      saveData?: boolean;
    };
  };
  const connection = navigatorWithConnection.connection;
  if (!connection) {
    return true;
  }

  if (connection.saveData) {
    return false;
  }

  return connection.effectiveType !== "slow-2g" &&
    connection.effectiveType !== "2g" &&
    connection.effectiveType !== "3g";
};

type WaitlistVariant = "hero" | "default";

interface LazyWaitlistFormProps {
  readonly variant?: WaitlistVariant;
  readonly height?: number;
}

const SkeletonBlock: React.FC<{ readonly height: number; readonly variant: WaitlistVariant }> = ({
  height,
  variant,
}) => {
  const isHero = variant === "hero";

  return (
    <div
      style={{
        minHeight: height,
        borderRadius: "16px",
        border: isHero ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(255, 255, 255, 0.08)",
        background: isHero
          ? "linear-gradient(135deg, rgba(15,15,24,0.92) 0%, rgba(20,22,36,0.88) 100%)"
          : "rgba(255, 255, 255, 0.04)",
        boxShadow: isHero ? "0 24px 60px rgba(15, 20, 36, 0.55)" : "none",
      }}
      aria-hidden="true"
    />
  );
};

const LazyWaitlistForm: React.FC<LazyWaitlistFormProps> = ({
  variant = "default",
  height,
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const triggerLoad = () => {
    startTransition(() => {
      setShouldLoad(true);
    });
  };

  const skeletonHeight = useMemo(() => {
    if (typeof height === "number") {
      return height;
    }

    return variant === "hero" ? 420 : 360;
  }, [height, variant]);

  useMountEffect(() => {
    if (shouldLoad) {
      return;
    }

    if (variant === "hero") {
      if (!shouldAutoLoadHeroForm()) {
        return;
      }

      const cancelWarmup = scheduleIdleLoad(() => {
        void importWaitlistForm();
      }, 180);

      const cancelRender = scheduleIdleLoad(() => {
        triggerLoad();
      }, 360);

      return () => {
        cancelWarmup();
        cancelRender();
      };
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          triggerLoad();
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  });

  const skeleton = <SkeletonBlock height={skeletonHeight} variant={variant} />;

  return (
    <div
      ref={containerRef}
      style={{ width: "100%" }}
      onPointerDown={triggerLoad}
      onFocusCapture={triggerLoad}
      onMouseEnter={variant === "hero" ? triggerLoad : undefined}
    >
      <Suspense fallback={skeleton}>
        {shouldLoad ? <WaitlistForm variant={variant} /> : skeleton}
      </Suspense>
    </div>
  );
};

export default LazyWaitlistForm;
