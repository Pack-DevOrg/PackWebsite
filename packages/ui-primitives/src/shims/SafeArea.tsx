import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';

export type SafeAreaViewProps = {
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: React.ReactNode;
};

export function SafeAreaView({
  style,
  children,
}: SafeAreaViewProps): React.ReactElement {
  return <View style={[styles.safe, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    minHeight: 0,
  },
});
