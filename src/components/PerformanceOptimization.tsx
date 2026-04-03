/**
 * @file PerformanceOptimization.tsx
 * @description Minimal, deterministic performance tweaks.
 *
 * This intentionally avoids speculative prefetch/dns-prefetch and fragile
 * preloads (e.g. `/node_modules/*` paths). Those can slow initial load and
 * reduce reliability in production.
 */

import React from "react";
import { env } from "../utils/env";
import { useMountEffect } from "@/hooks/useMountEffect";

interface PerformanceOptimizationProps {
  readonly page: string;
}

type IdleCallbackHandle = number;

type IdleWindowLike = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

const scheduleIdle = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const idleWindow = window as IdleWindowLike;

  if (typeof idleWindow.requestIdleCallback === "function") {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 500 });
    return () => {
      if (typeof idleWindow.cancelIdleCallback === "function") {
        idleWindow.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutId = window.setTimeout(callback, 120);
  return () => window.clearTimeout(timeoutId);
};

const optimizeImages = () => {
  const images = document.querySelectorAll<HTMLImageElement>("img:not([loading])");
  images.forEach((img, index) => {
    if (index < 2) {
      img.setAttribute("loading", "eager");
      img.setAttribute("fetchpriority", "high");
    } else {
      img.setAttribute("loading", "lazy");
    }
  });
};

const PerformanceOptimizationInstance: React.FC<PerformanceOptimizationProps> = ({ page }) => {
  useMountEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Keep this extremely cheap on the critical path.
    const cancel = scheduleIdle(() => {
      optimizeImages();

      // Optional dev-only visibility.
      if (env.DEV) {
         
        console.log("[perf] applied lightweight hints for page:", page);
      }
    });

    return () => cancel();
  });

  return null;
};

const PerformanceOptimization: React.FC<PerformanceOptimizationProps> = ({ page }) => (
  <PerformanceOptimizationInstance key={page} page={page} />
);

export default PerformanceOptimization;
