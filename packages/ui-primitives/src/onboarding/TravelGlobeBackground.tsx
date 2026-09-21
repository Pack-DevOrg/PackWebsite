import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';

import {tokens} from '../tokens';
import {GLOBE_FLIGHT_PATHS} from './globeFlightPaths.generated';
import globePosterUrl from './globe-poster.webp';

const BREATHE_MS = 7000;
const BOB_MS = 9000;
const BREATHE_SCALE = 0.025;
const BOB_DISTANCE = 4;
const FLIGHT_COLOR = '#FFE36A';
const FLIGHT_GLOW_COLOR = `${tokens.colors.primary}59`;
const FLIGHT_DOT_SIZE = 5;
const FLIGHT_HALO_SIZE = 13;
const FLIGHT_TRAIL_SIZE = 3;
const FLIGHT_BASE_MS = 5200;
const FLIGHT_MS_STEP = 450;
const FLIGHT_BASE_PAUSE_MS = 5600;
const FLIGHT_PAUSE_STEP_MS = 2711;
const FLIGHT_STAGGER_MS = 1400;

type FlightTrack = {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  readonly flightMs: number;
  readonly pauseMs: number;
  readonly delayMs: number;
};

function windowSize(): {readonly width: number; readonly height: number} {
  if (typeof window === 'undefined') {
    return {width: 390, height: 844};
  }
  return Dimensions.get('window');
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function samplePath(
  points: ReadonlyArray<readonly [number, number]>,
  progress: number,
  size: number,
): {readonly x: number; readonly y: number} {
  if (points.length === 0) {
    return {x: 0, y: 0};
  }
  const last = points.length - 1;
  const scaled = Math.min(1, Math.max(0, progress)) * last;
  const index = Math.floor(scaled);
  const next = Math.min(last, index + 1);
  const t = scaled - index;
  const a = points[index] ?? points[0];
  const b = points[next] ?? a;
  return {
    x: (a[0] + (b[0] - a[0]) * t) * size,
    y: (a[1] + (b[1] - a[1]) * t) * size,
  };
}

const FlightDot: React.FC<{
  readonly track: FlightTrack;
  readonly points: ReadonlyArray<readonly [number, number]>;
  readonly globeSize: number;
}> = ({track, points, globeSize}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [coords, setCoords] = useState(() =>
    samplePath(points, 0, globeSize),
  );

  useLayoutEffect(() => {
    const id = progress.addListener(({value}) => {
      setCoords(samplePath(points, value, globeSize));
    });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(track.delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: track.flightMs,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.delay(track.pauseMs),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => {
      progress.removeListener(id);
      loop.stop();
    };
  }, [globeSize, points, progress, track]);

  return (
    <View
      style={[
        styles.flightDot,
        {
          transform: [
            {translateX: coords.x - FLIGHT_HALO_SIZE / 2},
            {translateY: coords.y - FLIGHT_HALO_SIZE / 2},
          ],
        },
      ]}>
      <View style={styles.flightTrail} />
      <View style={styles.flightDotCore} />
    </View>
  );
};

export type TravelGlobeBackgroundProps = {
  readonly offsetY?: number;
};

export function TravelGlobeBackground({
  offsetY = 0,
}: TravelGlobeBackgroundProps): React.ReactElement {
  const {width, height} = windowSize();
  const globeSize = Math.min(width, height) * 0.75;
  const globeVisible = globeSize * 0.9;
  const crop = (globeSize - globeVisible) / 2;
  const reduceMotion = prefersReducedMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0.5)).current;

  const tracks: readonly FlightTrack[] = useMemo(
    () =>
      GLOBE_FLIGHT_PATHS.map((flightPath, i) => ({
        xs: flightPath.points.map(pt => pt[0] * globeSize),
        ys: flightPath.points.map(pt => pt[1] * globeSize),
        flightMs: FLIGHT_BASE_MS + (i % 4) * FLIGHT_MS_STEP,
        pauseMs: FLIGHT_BASE_PAUSE_MS + ((i * FLIGHT_PAUSE_STEP_MS) % 4200),
        delayMs: i * FLIGHT_STAGGER_MS,
      })),
    [globeSize],
  );

  useLayoutEffect(() => {
    if (reduceMotion) {
      breathe.setValue(0);
      bob.setValue(0.5);
      return undefined;
    }
    const easing = Easing.inOut(Easing.ease);
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: BREATHE_MS,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: BREATHE_MS,
          easing,
          useNativeDriver: false,
        }),
      ]),
    );
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: BOB_MS,
          easing,
          useNativeDriver: false,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: BOB_MS,
          easing,
          useNativeDriver: false,
        }),
      ]),
    );
    breatheLoop.start();
    bobLoop.start();
    return () => {
      breatheLoop.stop();
      bobLoop.stop();
    };
  }, [bob, breathe, reduceMotion]);

  const scale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1 + BREATHE_SCALE],
  });
  const translateY = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [offsetY - BOB_DISTANCE, offsetY + BOB_DISTANCE],
  });

  return (
    <View style={styles.container} testID="travel-globe-background">
      <Animated.View
        style={{
          width: globeVisible,
          height: globeVisible,
          borderRadius: globeVisible / 2,
          overflow: 'hidden',
          transform: [{translateY}, {scale}],
        }}>
        <Image
          source={{uri: globePosterUrl}}
          style={{
            position: 'absolute',
            top: -crop,
            left: -crop,
            width: globeSize,
            height: globeSize,
          }}
          resizeMode="contain"
        />
        {reduceMotion
          ? null
          : tracks.map((track, i) => (
              <FlightDot
                key={`${GLOBE_FLIGHT_PATHS[i]?.from ?? i}-${GLOBE_FLIGHT_PATHS[i]?.to ?? i}`}
                track={track}
                points={GLOBE_FLIGHT_PATHS[i]?.points ?? []}
                globeSize={globeSize}
              />
            ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    pointerEvents: 'none',
  },
  flightDot: {
    position: 'absolute',
    width: FLIGHT_HALO_SIZE,
    height: FLIGHT_HALO_SIZE,
    borderRadius: FLIGHT_HALO_SIZE / 2,
    backgroundColor: FLIGHT_GLOW_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightDotCore: {
    width: FLIGHT_DOT_SIZE,
    height: FLIGHT_DOT_SIZE,
    borderRadius: FLIGHT_DOT_SIZE / 2,
    backgroundColor: FLIGHT_COLOR,
  },
  flightTrail: {
    position: 'absolute',
    width: FLIGHT_TRAIL_SIZE,
    height: FLIGHT_TRAIL_SIZE,
    borderRadius: FLIGHT_TRAIL_SIZE / 2,
    backgroundColor: FLIGHT_COLOR,
  },
});
