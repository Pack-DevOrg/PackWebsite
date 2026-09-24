import React from 'react';
import {View} from 'react-native';

function SvgPart({children}: {children?: React.ReactNode}): React.ReactElement {
  return React.createElement(View, null, children);
}

(SvgPart as typeof SvgPart & {View: typeof View}).View = View;

export const Svg = SvgPart;
export const Path = SvgPart;
export const Rect = SvgPart;
export const Circle = SvgPart;
export const G = SvgPart;
export const Line = SvgPart;
export const Polyline = SvgPart;
export const Polygon = SvgPart;
export const Ellipse = SvgPart;

export function LinearGradient({
  children,
  colors,
  style,
}: {
  children?: React.ReactNode;
  colors?: readonly string[];
  style?: object;
}): React.ReactElement {
  const backgroundImage = colors ? `linear-gradient(90deg, ${colors.join(', ')})` : undefined;
  return React.createElement(
    View,
    {style: [style, backgroundImage ? {backgroundImage} : null]},
    children,
  );
}

export function SafeAreaView({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: object;
}): React.ReactElement {
  return React.createElement(View, {style}, children);
}

export function SafeAreaProvider({children}: {children?: React.ReactNode}): React.ReactNode {
  return children ?? null;
}

export function useSafeAreaInsets(): {top: number; right: number; bottom: number; left: number} {
  return {top: 0, right: 0, bottom: 0, left: 0};
}

export function useNavigation(): {goBack: () => void; navigate: () => void} {
  return {
    goBack() {},
    navigate() {},
  };
}

export function useFocusEffect(_effect: () => void | (() => void)): void {}

export function NavigationContainer({children}: {children?: React.ReactNode}): React.ReactNode {
  return children ?? null;
}

export function useSharedValue<T>(value: T): {value: T} {
  return {value};
}

export function useAnimatedStyle(factory: () => object): object {
  return factory();
}

export function withTiming<T>(value: T): T {
  return value;
}

export function withSequence<T>(value: T): T {
  return value;
}

export function withDelay<T>(_delayMs: number, value: T): T {
  return value;
}

export default SvgPart;
