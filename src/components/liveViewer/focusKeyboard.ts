/**
 * Relay `Pack.focus` → the phone keyboard the hidden TextInput should raise.
 *
 * iOS only offers SMS one-time-code autofill when the field is
 * `textContentType="oneTimeCode"`, and only offers saved passwords when it is
 * secure + `password`. Getting this right is what makes login feel native.
 */

import type {PackFocusEvent} from './types';

export type RemoteFieldKind =
  | 'none'
  | 'text'
  | 'email'
  | 'username'
  | 'password'
  | 'otp'
  | 'phone'
  | 'number'
  | 'search'
  | 'url';

export interface KeyboardConfig {
  readonly kind: RemoteFieldKind;
  readonly secureTextEntry: boolean;
  readonly textContentType:
    | 'none'
    | 'emailAddress'
    | 'username'
    | 'password'
    | 'oneTimeCode'
    | 'telephoneNumber'
    | 'URL';
  readonly autoComplete:
    | 'off'
    | 'email'
    | 'username'
    | 'current-password'
    | 'one-time-code'
    | 'tel'
    | 'url';
  readonly keyboardType:
    | 'default'
    | 'email-address'
    | 'number-pad'
    | 'phone-pad'
    | 'web-search'
    | 'url';
  readonly returnKeyType: 'go' | 'search' | 'next' | 'done';
  /** Show the login helpers (Fill from Vault, Remember me). */
  readonly isLoginField: boolean;
}

const NONE: KeyboardConfig = {
  kind: 'none',
  secureTextEntry: false,
  textContentType: 'none',
  autoComplete: 'off',
  keyboardType: 'default',
  returnKeyType: 'go',
  isLoginField: false,
};

function tokens(value: string | undefined): string[] {
  return (value ?? '').toLowerCase().split(/\s+/).filter(Boolean);
}

export function remoteFieldKind(focus: PackFocusEvent): RemoteFieldKind {
  if (!focus.editable) {
    return 'none';
  }
  const type = (focus.inputType ?? '').toLowerCase();
  const autocomplete = tokens(focus.autocomplete);
  if (focus.isOtp || autocomplete.includes('one-time-code')) {
    return 'otp';
  }
  if (
    type === 'password' ||
    autocomplete.includes('current-password') ||
    autocomplete.includes('new-password')
  ) {
    return 'password';
  }
  if (type === 'email' || autocomplete.includes('email')) {
    return 'email';
  }
  if (autocomplete.includes('username')) {
    return 'username';
  }
  if (type === 'tel' || autocomplete.includes('tel')) {
    return 'phone';
  }
  if (type === 'number') {
    return 'number';
  }
  if (type === 'search') {
    return 'search';
  }
  if (type === 'url' || autocomplete.includes('url')) {
    return 'url';
  }
  return focus.isLogin ? 'username' : 'text';
}

export function keyboardConfigForFocus(
  focus: PackFocusEvent | null,
): KeyboardConfig {
  if (!focus || !focus.editable) {
    return NONE;
  }
  const kind = remoteFieldKind(focus);
  const isLoginField =
    focus.isLogin || kind === 'password' || kind === 'username';
  const base = {kind, isLoginField, secureTextEntry: false};
  switch (kind) {
    case 'otp':
      return {
        ...base,
        textContentType: 'oneTimeCode',
        autoComplete: 'one-time-code',
        keyboardType: 'number-pad',
        returnKeyType: 'done',
      };
    case 'password':
      return {
        ...base,
        secureTextEntry: true,
        textContentType: 'password',
        autoComplete: 'current-password',
        keyboardType: 'default',
        returnKeyType: 'go',
      };
    case 'email':
      return {
        ...base,
        textContentType: isLoginField ? 'username' : 'emailAddress',
        autoComplete: isLoginField ? 'username' : 'email',
        keyboardType: 'email-address',
        returnKeyType: 'next',
      };
    case 'username':
      return {
        ...base,
        textContentType: 'username',
        autoComplete: 'username',
        keyboardType: 'email-address',
        returnKeyType: 'next',
      };
    case 'phone':
      return {
        ...base,
        textContentType: 'telephoneNumber',
        autoComplete: 'tel',
        keyboardType: 'phone-pad',
        returnKeyType: 'done',
      };
    case 'number':
      return {
        ...base,
        textContentType: 'none',
        autoComplete: 'off',
        keyboardType: 'number-pad',
        returnKeyType: 'done',
      };
    case 'search':
      return {
        ...base,
        textContentType: 'none',
        autoComplete: 'off',
        keyboardType: 'web-search',
        returnKeyType: 'search',
      };
    case 'url':
      return {
        ...base,
        textContentType: 'URL',
        autoComplete: 'url',
        keyboardType: 'url',
        returnKeyType: 'go',
      };
    default:
      return {
        ...base,
        textContentType: 'none',
        autoComplete: 'off',
        keyboardType: 'default',
        returnKeyType: 'go',
      };
  }
}
