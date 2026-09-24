import React from 'react';
import {View} from 'react-native';

export type IconProps = {
  size?: number;
  color?: string;
  style?: unknown;
};

export function useSharedValue<T>(value: T): {value: T} {
  return {value};
}

export function useAnimatedStyle<T>(factory: () => T): T {
  return factory();
}

export function withTiming<T>(value: T): T {
  return value;
}

export function withSequence<T>(...values: T[]): T | undefined {
  return values[values.length - 1];
}

export function withDelay<T>(_delayMs: number, value: T): T {
  return value;
}

export function useFocusEffect(): void {}

export function useNavigation(): {goBack: () => void} {
  return {
    goBack() {},
  };
}

function AnimatedView({
  children,
}: {
  readonly children?: React.ReactNode;
}): React.ReactElement {
  return React.createElement(View, null, children);
}

const Animated = {View: AnimatedView};
export default Animated;
