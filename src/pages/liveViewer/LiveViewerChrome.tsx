/**
 * Live viewer chrome: the one-line driver header, status banners, the
 * Pack-is-driving scrim, login helpers, and the pinned Done bar.
 *
 * Presentational only. It never forwards input and never clicks anything.
 */

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

// @ts-expect-error PackApp themes are resolved by the website resolver, not this tsconfig.
import {theme} from '@pack/app/themes';

import type {CdpClientStatus} from './cdpClient';
import type {LiveViewDriver, PackClosedReason} from './types';

export const LIVE_VIEWER_COPY = {
  userDriving: "You're driving",
  agentDriving: 'Pack is driving',
  done: 'Done, keep going',
  reconnecting: 'Reconnecting to the page…',
  connecting: 'Opening the page…',
  stale: 'Picture may be out of date',
  vaultFill: 'Fill from Vault',
  rememberSite: 'Remember me on this site',
  closed: {
    expired: 'This link expired. Reply to get a new one.',
    completed: 'All set. Pack has it from here.',
    upstream_gone: 'The page closed. Reply to get a new link.',
  } satisfies Record<PackClosedReason, string>,
  oneWayDoor: (label: string) => `Pack never taps “${label}”. You do.`,
} as const;

export interface LiveViewerHeaderProps {
  readonly driver: LiveViewDriver;
  readonly headline: string;
  readonly merchantHost?: string | undefined;
  readonly topInset: number;
}

export function LiveViewerHeader({
  driver,
  headline,
  merchantHost,
  topInset,
}: LiveViewerHeaderProps): React.ReactElement {
  const label =
    driver === 'user'
      ? LIVE_VIEWER_COPY.userDriving
      : LIVE_VIEWER_COPY.agentDriving;
  return (
    <View
      testID="live-viewer-header"
      style={[styles.header, {paddingTop: topInset + theme.spacing.s}]}
      accessibilityRole="header"
      accessibilityLabel={`${label}. ${headline}${
        merchantHost ? `. ${merchantHost}` : ''
      }`}>
      <View
        style={[
          styles.driverPill,
          driver === 'user' ? styles.driverPillUser : styles.driverPillAgent,
        ]}>
        <Text
          testID="live-viewer-driver"
          style={[
            styles.driverText,
            driver === 'user' ? styles.driverTextUser : styles.driverTextAgent,
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        testID="live-viewer-headline"
        style={styles.headline}
        numberOfLines={1}>
        {headline}
      </Text>
      {merchantHost ? (
        <Text style={styles.host} numberOfLines={1}>
          {merchantHost}
        </Text>
      ) : null}
    </View>
  );
}

export interface LiveViewerBannerProps {
  readonly status: CdpClientStatus;
  readonly hasFrame: boolean;
  readonly stale: boolean;
}

/** At most one banner: connection first, then staleness. */
export function LiveViewerBanner({
  status,
  hasFrame,
  stale,
}: LiveViewerBannerProps): React.ReactElement | null {
  let text: string | null = null;
  if (status === 'reconnecting') {
    text = LIVE_VIEWER_COPY.reconnecting;
  } else if ((status === 'connecting' || status === 'idle') && !hasFrame) {
    text = LIVE_VIEWER_COPY.connecting;
  } else if (status === 'open' && hasFrame && stale) {
    text = LIVE_VIEWER_COPY.stale;
  }
  if (!text) {
    return null;
  }
  return (
    <View
      testID="live-viewer-banner"
      style={styles.banner}
      pointerEvents="none"
      accessibilityLiveRegion="polite">
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

export function LiveViewerAgentScrim({
  headline,
}: {
  readonly headline: string;
}): React.ReactElement {
  return (
    <View
      testID="live-viewer-agent-scrim"
      style={styles.scrim}
      accessibilityLabel={`${LIVE_VIEWER_COPY.agentDriving}. ${headline}`}>
      <View style={styles.scrimCard}>
        <Text style={styles.scrimTitle}>{LIVE_VIEWER_COPY.agentDriving}</Text>
        <Text style={styles.scrimText} numberOfLines={2}>
          {headline}
        </Text>
      </View>
    </View>
  );
}

export function LiveViewerClosedScrim({
  reason,
}: {
  readonly reason: PackClosedReason;
}): React.ReactElement {
  return (
    <View testID="live-viewer-closed" style={styles.scrim}>
      <View style={styles.scrimCard}>
        <Text style={styles.scrimText}>{LIVE_VIEWER_COPY.closed[reason]}</Text>
      </View>
    </View>
  );
}

export interface LiveViewerLoginHelpersProps {
  readonly onVaultFill?: (() => void) | undefined;
  readonly rememberSite?: boolean | undefined;
  readonly onRememberSiteChange?: ((next: boolean) => void) | undefined;
}

export function LiveViewerLoginHelpers({
  onVaultFill,
  rememberSite,
  onRememberSiteChange,
}: LiveViewerLoginHelpersProps): React.ReactElement | null {
  if (!onVaultFill && !onRememberSiteChange) {
    return null;
  }
  return (
    <View testID="live-viewer-login-helpers" style={styles.helpers}>
      {onVaultFill ? (
        <Pressable
          testID="live-viewer-vault-fill"
          accessibilityRole="button"
          onPress={onVaultFill}
          style={styles.chip}>
          <Text style={styles.chipText}>{LIVE_VIEWER_COPY.vaultFill}</Text>
        </Pressable>
      ) : null}
      {onRememberSiteChange ? (
        <Pressable
          testID="live-viewer-remember-site"
          accessibilityRole="switch"
          accessibilityState={{checked: Boolean(rememberSite)}}
          onPress={() => onRememberSiteChange(!rememberSite)}
          style={[styles.chip, rememberSite ? styles.chipOn : null]}>
          <Text style={[styles.chipText, rememberSite ? styles.chipTextOn : null]}>
            {LIVE_VIEWER_COPY.rememberSite}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface LiveViewerDoneBarProps {
  readonly onDone: () => void;
  readonly bottomInset: number;
  readonly oneWayDoorLabel?: string | undefined;
  readonly busy?: boolean | undefined;
}

export function LiveViewerDoneBar({
  onDone,
  bottomInset,
  oneWayDoorLabel,
  busy,
}: LiveViewerDoneBarProps): React.ReactElement {
  return (
    <View
      style={[
        styles.doneBar,
        {paddingBottom: Math.max(bottomInset, theme.spacing.s12)},
      ]}>
      {oneWayDoorLabel ? (
        <Text style={styles.oneWay} numberOfLines={1}>
          {LIVE_VIEWER_COPY.oneWayDoor(oneWayDoorLabel)}
        </Text>
      ) : null}
      <Pressable
        testID="live-viewer-done"
        accessibilityRole="button"
        accessibilityState={{disabled: Boolean(busy)}}
        disabled={busy}
        onPress={onDone}
        style={({pressed}) => [
          styles.doneButton,
          pressed || busy ? styles.doneButtonPressed : null,
        ]}>
        <Text style={styles.doneText}>{LIVE_VIEWER_COPY.done}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.s,
    backgroundColor: theme.colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderSubtle,
  },
  driverPill: {
    borderRadius: theme.borderRadius.r16,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xxs,
  },
  driverPillUser: {
    backgroundColor: theme.colors.primary,
  },
  driverPillAgent: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderMedium,
  },
  driverText: {
    fontSize: theme.typography.fontSize.xs13,
    fontWeight: theme.typography.fontWeight.bold,
  },
  driverTextUser: {
    color: theme.colors.textOnPrimary,
  },
  driverTextAgent: {
    color: theme.colors.textPrimary,
  },
  headline: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.m15,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  host: {
    maxWidth: '35%',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
  },
  banner: {
    position: 'absolute',
    top: theme.spacing.s,
    alignSelf: 'center',
    borderRadius: theme.borderRadius.r16,
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.overlay70,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderMedium,
  },
  bannerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xs13,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlay40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  scrimCard: {
    maxWidth: 360,
    gap: theme.spacing.xs,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.darkGray2,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s12,
  },
  scrimTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs13,
    fontWeight: theme.typography.fontWeight.bold,
  },
  scrimText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.m15,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  helpers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
  },
  chip: {
    borderRadius: theme.borderRadius.r16,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.s12,
    paddingVertical: theme.spacing.s,
  },
  chipOn: {
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.s,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chipTextOn: {
    color: theme.colors.primary,
  },
  doneBar: {
    gap: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s12,
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.borderSubtle,
  },
  oneWay: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs13,
    textAlign: 'center',
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: theme.borderRadius.r16,
    backgroundColor: theme.colors.primary,
  },
  doneButtonPressed: {
    opacity: 0.8,
  },
  doneText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.typography.fontSize.m,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
