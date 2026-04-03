import {renderToString} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {ThemeProvider} from 'styled-components';

import EmailForwardingSetup from './EmailForwardingSetup';
import {I18nProvider} from '../i18n/I18nProvider';
import theme from '../styles/theme';

describe('EmailForwardingSetup (SSR)', () => {
  test('renders without throwing', () => {
    expect(() =>
      renderToString(
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={['/setup/email-forwarding?provider=gmail']}>
            <HelmetProvider>
              <I18nProvider>
                <EmailForwardingSetup />
              </I18nProvider>
            </HelmetProvider>
          </MemoryRouter>
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });
});
