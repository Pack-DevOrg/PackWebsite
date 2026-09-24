import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

export type LinearGradientProps = {
  readonly colors: readonly string[];
  readonly style?: StyleProp<ViewStyle>;
  readonly start?: {readonly x: number; readonly y: number};
  readonly end?: {readonly x: number; readonly y: number};
  readonly children?: React.ReactNode;
};

function gradientAngle(
  start: {readonly x: number; readonly y: number},
  end: {readonly x: number; readonly y: number},
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const radians = Math.atan2(dy, dx);
  return (radians * 180) / Math.PI + 90;
}

export function LinearGradient({
  colors,
  style,
  start = {x: 0, y: 0},
  end = {x: 0, y: 1},
  children,
}: LinearGradientProps): React.ReactElement {
  const angle = gradientAngle(start, end);
  const image = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
  return (
    <View
      style={[
        styles.fill,
        style,
        {backgroundImage: image} as unknown as ViewStyle,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    overflow: 'hidden',
    pointerEvents: 'none',
  },
});
