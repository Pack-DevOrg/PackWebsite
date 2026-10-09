/**
 * Pack's phone-native live browser viewer.
 *
 * The remote page is emulated at exactly this stage's size and pixel ratio,
 * so it fits the screen with no letterbox and the viewer itself never
 * scrolls. Touches are forwarded as touch events (the remote page scrolls),
 * and the phone keyboard types into whatever field the remote page focused.
 *
 * One-way doors: the viewer never clicks anything by itself. It only forwards
 * the user's own touches and keys, and only while the user is driving.
 */

import React from 'react';
import {
  Image,
  Keyboard,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';

// @ts-expect-error PackApp themes are resolved by the website resolver, not this tsconfig.
import {theme} from '@pack/app/themes';

import type {SocketFactory} from './cdpClient';
import {
  remotePointHitsFocusRect,
  stagePointToRemote,
  stagePointToRemoteClamped,
  type Point,
  type StageSize,
} from './coordinates';
import {keyboardConfigForFocus} from './focusKeyboard';
import {diffMirror, opsForDiff, remoteKeyFromNativeKey} from './keyMapping';
import type {TouchPhase} from './liveViewSession';
import {
  LIVE_VIEWER_COPY,
  LiveViewerAgentScrim,
  LiveViewerBanner,
  LiveViewerClosedScrim,
  LiveViewerDoneBar,
  LiveViewerHeader,
  LiveViewerLoginHelpers,
} from './LiveViewerChrome';
import type {
  LiveViewDriver,
  LiveViewTicket,
  PackClosedReason,
  ScreencastFrameMetadata,
} from './types';
import {useLiveViewSession} from './useLiveViewSession';

export const STALE_FRAME_MS = 5_000;
const MOVE_INTERVAL_MS = 16;
const FOCUS_RESET_WINDOW_MS = 1_500;

export interface LiveViewerStats {
  readonly lastTapToFrameMs: number | null;
}

export interface LiveViewerProps {
  readonly relayUrl: string;
  readonly ticket: string;
  readonly ticketExpiresAtMs: number;
  readonly installId: string;
  readonly driver: LiveViewDriver;
  readonly headline: string;
  readonly onDone: () => void;
  readonly merchantHost?: string | undefined;
  readonly oneWayDoorLabel?: string | undefined;
  readonly doneBusy?: boolean | undefined;
  /** Fresh ticket from `GET /live-view/viewer` before the current one expires. */
  readonly refreshTicket?: (() => Promise<LiveViewTicket>) | undefined;
  /** Vault seam (PackServer #1711). Chip shows on login fields when set. */
  readonly onVaultFill?: ((field: 'username' | 'password' | 'otp' | 'text') => void) | undefined;
  /** Session persistence seam (PackServer #1691). Toggle shows when set. */
  readonly rememberSite?: boolean | undefined;
  readonly onRememberSiteChange?: ((next: boolean) => void) | undefined;
  readonly onClosed?: ((reason: PackClosedReason) => void) | undefined;
  readonly onStats?: ((stats: LiveViewerStats) => void) | undefined;
  /** Test seam: inject a fake socket. */
  readonly createSocket?: SocketFactory | undefined;
}

const ZERO_INSETS = {top: 0, bottom: 0, left: 0, right: 0};
const FallbackInsets = React.createContext(ZERO_INSETS);

interface PageInputHandle {
  focus: () => void;
  blur: () => void;
}

/**
 * The real phone input. `focus()` runs inside the tap gesture so iOS will
 * raise the keyboard; `accessibilityState.selected` mirrors that for tests.
 */
const PageInput = React.forwardRef<PageInputHandle, React.ComponentProps<typeof TextInput>>(
  function PageInput(props, ref) {
    const innerRef = React.useRef<TextInput>(null);
    const [focused, setFocused] = React.useState(false);
    React.useImperativeHandle(ref, () => ({
      focus: () => {
        setFocused(true);
        const node = innerRef.current;
        if (node && typeof node.focus === 'function') {
          node.focus();
        }
      },
      blur: () => {
        setFocused(false);
        const node = innerRef.current;
        if (node && typeof node.blur === 'function') {
          node.blur();
        }
      },
    }));
    return (
      <TextInput
        {...props}
        ref={innerRef}
        accessibilityState={{...props.accessibilityState, selected: focused}}
      />
    );
  },
);

function focusPageInput(input: PageInputHandle | null): void {
  input?.focus();
}

function useNow(intervalMs: number): number {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Keyboard height (0 when hidden). The stage shrinks like Safari's viewport. */
function useKeyboardHeight(): number {
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e =>
      setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

export function LiveViewer(props: LiveViewerProps): React.ReactElement {
  const insets =
    React.useContext(SafeAreaInsetsContext ?? FallbackInsets) ?? ZERO_INSETS;
  const {session, state} = useLiveViewSession({
    relayUrl: props.relayUrl,
    ticket: props.ticket,
    ticketExpiresAtMs: props.ticketExpiresAtMs,
    installId: props.installId,
    driver: props.driver,
    headline: props.headline,
    pixelRatio: PixelRatio.get(),
    refreshTicket: props.refreshTicket,
    createSocket: props.createSocket,
  });
  const now = useNow(1_000);
  const keyboardHeight = useKeyboardHeight();
  const keyboardVisible = keyboardHeight > 0;

  const stageRef = React.useRef<View>(null);
  const stageSizeRef = React.useRef<StageSize | null>(null);
  const stageOriginRef = React.useRef<Point>({x: 0, y: 0});
  const metadataRef = React.useRef<ScreencastFrameMetadata | null>(null);
  metadataRef.current = state.frame?.metadata ?? null;
  const inputRef = React.useRef<PageInputHandle>(null);
  const [mirror, setMirror] = React.useState('');
  const mirrorRef = React.useRef('');
  const lastTouchEndRef = React.useRef(0);
  const moveRef = React.useRef<{last: number; queued: Point[] | null; timer: ReturnType<typeof setTimeout> | null}>({
    last: 0,
    queued: null,
    timer: null,
  });

  const userDriving =
    state.driver === 'user' &&
    state.closedReason === null &&
    state.status === 'open';
  const keyboard = keyboardConfigForFocus(userDriving ? state.focus : null);
  const focusRectsRef = React.useRef(state.focusRects);
  focusRectsRef.current = state.focusRects;
  const trackingRef = React.useRef(false);
  const [raisedByRect, setRaisedByRect] = React.useState(false);

  // Stats + closed callbacks.
  const {onStats, onClosed} = props;
  React.useEffect(() => {
    onStats?.({lastTapToFrameMs: state.lastTapToFrameMs});
  }, [onStats, state.lastTapToFrameMs]);
  React.useEffect(() => {
    if (state.closedReason) {
      onClosed?.(state.closedReason);
    }
  }, [onClosed, state.closedReason]);

  // A focus rect raises the keyboard in the tap gesture. Pack.focus only
  // refines the keyboard type; waiting on it drops the iOS gesture.
  const editable = userDriving && (keyboard.kind !== 'none' || raisedByRect);
  React.useEffect(() => {
    if (state.focus && !state.focus.editable) {
      setRaisedByRect(false);
    }
  }, [state.focus]);
  React.useEffect(() => {
    if (!editable) {
      inputRef.current?.blur();
      return;
    }
    if (Date.now() - lastTouchEndRef.current < FOCUS_RESET_WINDOW_MS) {
      mirrorRef.current = '';
      setMirror('');
    }
    focusPageInput(inputRef.current);
  }, [editable, state.focus]);

  const onStageLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const {width, height} = event.nativeEvent.layout;
      const size = {width, height};
      stageSizeRef.current = size;
      session.setStage(size);
      const node = stageRef.current;
      if (node && typeof node.measureInWindow === 'function') {
        node.measureInWindow((x, y) => {
          stageOriginRef.current = {x, y};
        });
      }
    },
    [session],
  );

  const pointsFor = React.useCallback(
    (event: GestureResponderEvent, clamp: boolean): Point[] | null => {
      const stage = stageSizeRef.current;
      const meta = metadataRef.current;
      if (!stage || !meta) {
        return null;
      }
      const origin = stageOriginRef.current;
      const native = event.nativeEvent;
      const raw =
        native.touches && native.touches.length > 0
          ? native.touches.map(t => ({x: t.pageX - origin.x, y: t.pageY - origin.y}))
          : [{x: native.locationX, y: native.locationY}];
      const mapped: Point[] = [];
      for (const p of raw) {
        const remote = clamp
          ? stagePointToRemoteClamped(p, stage, meta)
          : stagePointToRemote(p, stage, meta);
        if (remote) {
          mapped.push(remote);
        }
      }
      return mapped.length > 0 ? mapped : null;
    },
    [],
  );

  const flushMove = React.useCallback(() => {
    const move = moveRef.current;
    if (move.timer) {
      clearTimeout(move.timer);
      move.timer = null;
    }
    if (move.queued) {
      session.touch('touchMove', move.queued);
      move.queued = null;
      move.last = Date.now();
    }
  }, [session]);

  const forward = React.useCallback(
    (phase: TouchPhase, event: GestureResponderEvent) => {
      if (phase === 'touchStart') {
        const points = pointsFor(event, false);
        if (!points) {
          trackingRef.current = false;
          return;
        }
        trackingRef.current = true;
        session.touch('touchStart', points);
        const hit = points.some(point =>
          focusRectsRef.current.some(rect => remotePointHitsFocusRect(point, rect)),
        );
        if (hit) {
          setRaisedByRect(true);
          focusPageInput(inputRef.current);
        }
        return;
      }
      if (!trackingRef.current) {
        return;
      }
      if (phase === 'touchMove') {
        const points = pointsFor(event, true);
        if (!points) {
          return;
        }
        const move = moveRef.current;
        move.queued = points;
        const since = Date.now() - move.last;
        if (since >= MOVE_INTERVAL_MS) {
          flushMove();
        } else if (!move.timer) {
          move.timer = setTimeout(flushMove, MOVE_INTERVAL_MS - since);
        }
        return;
      }
      flushMove();
      lastTouchEndRef.current = Date.now();
      session.touch(phase, []);
    },
    [flushMove, pointsFor, session],
  );

  const onChangeText = React.useCallback(
    (next: string) => {
      for (const op of opsForDiff(diffMirror(mirrorRef.current, next))) {
        if (op.kind === 'key') {
          session.pressKey(op.key);
        } else {
          session.insertText(op.text);
        }
      }
      mirrorRef.current = next;
      setMirror(next);
    },
    [session],
  );

  const onKeyPress = React.useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = remoteKeyFromNativeKey(event.nativeEvent.key);
      // Backspace on an empty mirror deletes text that was already on the page.
      if (key === 'Backspace' && mirrorRef.current.length === 0) {
        session.pressKey('Backspace');
      } else if (key === 'Tab') {
        session.pressKey('Tab');
      }
    },
    [session],
  );

  const onSubmitEditing = React.useCallback(() => {
    session.pressKey('Enter');
    mirrorRef.current = '';
    setMirror('');
  }, [session]);

  const stale =
    state.frame !== null && now - state.lastAliveAtMs > STALE_FRAME_MS;
  const showLoginHelpers =
    userDriving && keyboard.isLoginField && Boolean(props.onVaultFill || props.onRememberSiteChange);
  const vaultField =
    keyboard.kind === 'password' || keyboard.kind === 'otp' || keyboard.kind === 'username'
      ? keyboard.kind
      : 'text';

  return (
    <View testID="live-viewer" style={styles.root}>
      <LiveViewerHeader
        driver={state.driver}
        headline={state.headline}
        merchantHost={props.merchantHost}
        topInset={insets.top}
      />
      <View
        ref={stageRef}
        testID="live-viewer-stage"
        style={styles.stage}
        onLayout={onStageLayout}
        accessible
        accessibilityLabel={`Live page${props.merchantHost ? ` on ${props.merchantHost}` : ''}`}
        onStartShouldSetResponder={() => userDriving}
        onMoveShouldSetResponder={() => userDriving}
        onResponderTerminationRequest={() => false}
        onResponderGrant={e => forward('touchStart', e)}
        onResponderMove={e => forward('touchMove', e)}
        onResponderRelease={e => forward('touchEnd', e)}
        onResponderTerminate={e => forward('touchCancel', e)}>
        {state.frame ? (
          <Image
            testID="live-viewer-frame"
            source={{uri: state.frame.uri}}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            fadeDuration={0}
            pointerEvents="none"
          />
        ) : (
          <View style={styles.placeholder} pointerEvents="none">
            <Text style={styles.placeholderText}>
              {LIVE_VIEWER_COPY.connecting}
            </Text>
          </View>
        )}
        {state.closedReason ? (
          <LiveViewerClosedScrim reason={state.closedReason} />
        ) : state.driver === 'agent' ? (
          <LiveViewerAgentScrim headline={state.headline} />
        ) : null}
        <LiveViewerBanner
          status={state.status}
          hasFrame={state.frame !== null}
          stale={stale}
        />
      </View>
      {showLoginHelpers ? (
        <LiveViewerLoginHelpers
          onVaultFill={
            props.onVaultFill ? () => props.onVaultFill?.(vaultField) : undefined
          }
          rememberSite={props.rememberSite}
          onRememberSiteChange={props.onRememberSiteChange}
        />
      ) : null}
      {state.driver === 'user' && !state.closedReason && !keyboardVisible ? (
        <LiveViewerDoneBar
          onDone={props.onDone}
          bottomInset={insets.bottom}
          oneWayDoorLabel={props.oneWayDoorLabel}
          busy={props.doneBusy}
        />
      ) : null}
      {keyboardVisible ? <View style={{height: keyboardHeight}} /> : null}
      <PageInput
        ref={inputRef}
        testID="live-viewer-keyboard"
        style={styles.hiddenInput}
        value={mirror}
        onChangeText={onChangeText}
        onKeyPress={onKeyPress}
        onSubmitEditing={onSubmitEditing}
        submitBehavior="submit"
        editable={userDriving}
        caretHidden
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        secureTextEntry={keyboard.secureTextEntry}
        textContentType={keyboard.textContentType}
        autoComplete={keyboard.autoComplete}
        keyboardType={keyboard.keyboardType}
        returnKeyType={keyboard.returnKeyType}
        keyboardAppearance="dark"
        accessibilityLabel="Type on the page"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.black,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.s,
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    height: 1,
    opacity: 0,
  },
});
