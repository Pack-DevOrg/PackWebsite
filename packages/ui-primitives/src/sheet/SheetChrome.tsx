import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {tokens} from '../tokens';

export function SheetGrabber(): React.ReactElement {
  return <View style={chromeStyles.grabber} />;
}

export const SheetChromeGrabber = SheetGrabber;

export function SheetCloseButton({
  onPress,
  accessibilityLabel = 'Close',
  testID,
}: {
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
  readonly testID?: string;
}): React.ReactElement {
  return (
    <Pressable
      style={({pressed}) => [
        chromeStyles.closeButton,
        pressed && chromeStyles.closeButtonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}>
      <Text style={chromeStyles.closeGlyph}>×</Text>
    </Pressable>
  );
}

export function SheetHeader({
  title,
  subtitle,
  onClose,
  testID,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly onClose?: () => void;
  readonly testID?: string;
}): React.ReactElement {
  return (
    <View style={chromeStyles.headerRow} testID={testID}>
      <SheetGrabber />
      <View style={chromeStyles.headerTextWrap}>
        <Text
          style={chromeStyles.headerTitle}
          accessibilityRole="header"
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined ? (
          <Text style={chromeStyles.headerSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {onClose !== undefined ? (
        <SheetCloseButton onPress={onClose} />
      ) : null}
    </View>
  );
}

const chromeStyles = StyleSheet.create({
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.colors.borderMedium,
    marginBottom: tokens.spacing.s,
  },
  headerRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: tokens.spacing.m,
    paddingTop: tokens.spacing.s,
    paddingBottom: tokens.spacing.s12,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSize.l,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  headerSubtitle: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontSize.s,
    marginTop: tokens.spacing.xs,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: tokens.colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: tokens.spacing.m,
    top: tokens.spacing.m,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeGlyph: {
    color: tokens.colors.textPrimary,
    fontSize: 18,
    lineHeight: 20,
  },
});
