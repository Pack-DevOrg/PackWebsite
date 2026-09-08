import {render, screen, waitFor, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import {ThemeProvider} from 'styled-components';

import EmailForwardingSetup from './EmailForwardingSetup';
import {I18nProvider} from '../i18n/I18nProvider';
import theme from '../styles/theme';

const apiRequestMock = jest.fn();

jest.mock('@/api/useApiClient', () => ({
  useApiClient: () => ({
    request: apiRequestMock,
  }),
}));

function okEnvelope(data: {forwardTo: string; code?: string}) {
  return {
    success: true as const,
    data,
  };
}

function renderPage(path = '/setup/email-forwarding?provider=gmail') {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <HelmetProvider>
          <I18nProvider>
            <EmailForwardingSetup />
          </I18nProvider>
        </HelmetProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe('EmailForwardingSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRequestMock.mockResolvedValue(
      okEnvelope({forwardTo: 'trips@trypackai.com'}),
    );
  });

  test('renders Gmail desktop guide and filter import steps', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', {name: /email forwarding setup/i}),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: /open gmail forwarding settings/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /download filters xml/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /open gmail filters/i}),
    ).toBeInTheDocument();
  });

  test('Gmail step order is address, then confirmation code, then filters', async () => {
    renderPage();

    const address = await screen.findByText("Add Pack’s address in Gmail");
    const confirm = screen.getByText('Enter the code in Gmail to confirm');
    const filters = screen.getByText('Create filters for travel domains');

    expect(
      address.compareDocumentPosition(confirm) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      confirm.compareDocumentPosition(filters) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      screen.queryByText(/start guided setup/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/start guided gmail setup/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/setup-first/i)).not.toBeInTheDocument();
  });

  test('a captured code marks the address step done and surfaces the code', async () => {
    apiRequestMock.mockResolvedValue(
      okEnvelope({forwardTo: 'trips@trypackai.com', code: '847291'}),
    );

    renderPage();

    expect(await screen.findByText('847291')).toBeInTheDocument();
    expect(screen.getByText('Gmail verification code')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Enter this code in Gmail settings to confirm the address',
      ),
    ).toBeInTheDocument();

    const addressStep = screen.getByTestId('gmail-step-address');
    expect(addressStep).toHaveAttribute('data-state', 'done');
    expect(within(addressStep).queryByText('1')).not.toBeInTheDocument();
    expect(within(addressStep).getByLabelText(/done/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/user/accounts/privacy-forwarding/verification-code',
        }),
      );
    });
  });

  test('filters stay disabled until a confirmation code is present', async () => {
    const {unmount} = renderPage();

    const downloadBefore = await screen.findByRole('button', {
      name: /download filters xml/i,
    });
    const openFiltersBefore = screen.getByRole('button', {
      name: /open gmail filters/i,
    });
    expect(downloadBefore).toBeDisabled();
    expect(openFiltersBefore).toBeDisabled();

    unmount();

    apiRequestMock.mockResolvedValue(
      okEnvelope({forwardTo: 'trips@trypackai.com', code: '847291'}),
    );
    renderPage();

    const downloadAfter = await screen.findByRole('button', {
      name: /download filters xml/i,
    });
    const openFiltersAfter = screen.getByRole('button', {
      name: /open gmail filters/i,
    });
    expect(downloadAfter).toBeEnabled();
    expect(openFiltersAfter).toBeEnabled();
  });
});
