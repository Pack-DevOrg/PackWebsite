/**
 * @jest-environment node
 */

import React from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import {PassThrough} from 'node:stream';
import {Router} from 'react-router-dom';
import {createMemoryHistory} from 'history';
import {ThemeProvider} from 'styled-components';
import {HelmetProvider} from 'react-helmet-async';

import EmailForwardingSetup from './EmailForwardingSetup';
import {I18nProvider} from '../i18n/I18nProvider';
import theme from '../styles/theme';

describe('EmailForwardingSetup (streaming SSR)', () => {
  test('renders without SSR errors', async () => {
    const history = createMemoryHistory({
      initialEntries: ['/setup/email-forwarding?provider=gmail'],
    });

    const AnyRouter = Router as unknown as React.ComponentType<{
      readonly location: unknown;
      readonly navigator: unknown;
      readonly children: React.ReactNode;
    }>;

    const app = (
      <ThemeProvider theme={theme}>
        <HelmetProvider>
          <AnyRouter location={history.location} navigator={history}>
            <I18nProvider>
              <EmailForwardingSetup />
            </I18nProvider>
          </AnyRouter>
        </HelmetProvider>
      </ThemeProvider>
    );

    const errors: unknown[] = [];
    const stream = new PassThrough();
    const chunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => resolve());
      stream.on('error', reject);

      const {pipe, abort} = renderToPipeableStream(app, {
        onAllReady: () => pipe(stream),
        onShellError: reject,
        onError: (error) => {
          errors.push(error);
        },
      });

      setTimeout(() => abort(), 5000).unref?.();
    });

    expect(chunks.join('')).toContain('Email forwarding setup');
    if (errors.length > 0) {
      // Re-throw the first error so Jest prints a useful stack.
      throw errors[0];
    }
  });
});
