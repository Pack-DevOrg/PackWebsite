import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {ThemeProvider} from 'styled-components';

import EmailForwardingSetup from './EmailForwardingSetup';
import {I18nProvider} from '../i18n/I18nProvider';
import theme from '../styles/theme';

describe('EmailForwardingSetup', () => {
  test('renders Gmail desktop guide and filter import steps', () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/setup/email-forwarding?provider=gmail']}>
          <HelmetProvider>
            <I18nProvider>
              <EmailForwardingSetup />
            </I18nProvider>
          </HelmetProvider>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole('heading', {name: /email forwarding setup/i}),
    ).toBeInTheDocument();
    expect(screen.getByText(/send desktop guide/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /download filters xml/i}),
    ).toBeInTheDocument();

    const openFiltersLinks = screen.getAllByRole('link', {
      name: /open gmail filters/i,
    });
    expect(openFiltersLinks.length).toBeGreaterThan(0);
    openFiltersLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
    });

    const openForwarding = screen.getByRole('link', {
      name: /open gmail forwarding settings/i,
    });
    expect(openForwarding).toHaveAttribute('target', '_blank');
  });
});
