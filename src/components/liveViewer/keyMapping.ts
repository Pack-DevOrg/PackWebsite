/**
 * Phone keyboard → remote page input.
 *
 * Printable text goes through `Input.insertText` (IME-safe, one call per
 * change). Editing keys go through `Input.dispatchKeyEvent` keyDown/keyUp
 * pairs with the Windows virtual key codes Chrome expects.
 *
 * The hidden TextInput keeps a local mirror of what the user typed so the
 * iOS keyboard keeps its context (autocap, predictive, autofill). Each change
 * is diffed against the mirror: deleted tail → Backspaces, new tail → text.
 */

export type RemoteKey = 'Backspace' | 'Enter' | 'Tab';

export interface KeyEventParams {
  readonly type: 'keyDown' | 'keyUp' | 'rawKeyDown' | 'char';
  readonly key: string;
  readonly code: string;
  readonly windowsVirtualKeyCode: number;
  readonly nativeVirtualKeyCode: number;
  readonly text?: string | undefined;
  readonly unmodifiedText?: string | undefined;
}

const KEY_TABLE: Readonly<
  Record<RemoteKey, {code: string; vk: number; text?: string}>
> = {
  Backspace: {code: 'Backspace', vk: 8},
  Enter: {code: 'Enter', vk: 13, text: '\r'},
  Tab: {code: 'Tab', vk: 9},
};

/** RN `onKeyPress` key → remote key, or null for printable/unknown keys. */
export function remoteKeyFromNativeKey(key: string): RemoteKey | null {
  if (key === 'Backspace' || key === 'Enter' || key === 'Tab') {
    return key;
  }
  return null;
}

/** keyDown (+ text when the key types a char) then keyUp. */
export function keyEventsFor(key: RemoteKey): KeyEventParams[] {
  const entry = KEY_TABLE[key];
  const down: KeyEventParams = {
    type: 'keyDown',
    key,
    code: entry.code,
    windowsVirtualKeyCode: entry.vk,
    nativeVirtualKeyCode: entry.vk,
    ...(entry.text ? {text: entry.text, unmodifiedText: entry.text} : {}),
  };
  const up: KeyEventParams = {
    type: 'keyUp',
    key,
    code: entry.code,
    windowsVirtualKeyCode: entry.vk,
    nativeVirtualKeyCode: entry.vk,
  };
  return [down, up];
}

export interface TextDiff {
  /** Backspaces to send first (chars removed from the end of the mirror). */
  readonly backspaces: number;
  /** Text to insert after the backspaces. */
  readonly insert: string;
}

/**
 * Diff the hidden input's previous mirror against its new value.
 * Covers typing, deleting, autocorrect word swaps, and autofill pastes.
 * Diffs by code point so emoji are never split.
 */
export function diffMirror(previous: string, next: string): TextDiff {
  const a = Array.from(previous);
  const b = Array.from(next);
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
    prefix += 1;
  }
  return {
    backspaces: a.length - prefix,
    insert: b.slice(prefix).join(''),
  };
}

export type RemoteInputOp =
  | {readonly kind: 'key'; readonly key: RemoteKey}
  | {readonly kind: 'text'; readonly text: string};

/** A mirror diff as the ordered ops the viewer sends. */
export function opsForDiff(diff: TextDiff): RemoteInputOp[] {
  const ops: RemoteInputOp[] = [];
  for (let i = 0; i < diff.backspaces; i += 1) {
    ops.push({kind: 'key', key: 'Backspace'});
  }
  if (diff.insert.length > 0) {
    ops.push({kind: 'text', text: diff.insert});
  }
  return ops;
}
