import styled from 'styled-components';
import LegalMarkdownRenderer from '../components/LegalMarkdownRenderer';
import {useI18n} from '../i18n/I18nProvider';
import {getLegalDocumentOrThrow} from '../legal/legalDocuments';
import {stripLeadingMarkdownH1, useLegalMarkdown} from './useLegalMarkdown';

const MarkdownContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-4) 0;
  line-height: 1.6;
  color: var(--color-text-primary);
  font-family: var(--font-body);

  > h1 {
    margin-bottom: var(--space-4);
    color: var(--color-text-primary);
  }

  :is(h2, h3) {
    margin-top: var(--space-5);
    margin-bottom: var(--space-2);
    color: var(--color-text-primary);
    line-height: 1.2;
  }

  :is(p, li) {
    color: rgba(247, 240, 227, 0.9);
    font-family: var(--font-body);
    font-size: var(--font-size-base);
    line-height: 1.7;
  }

  p {
    margin-bottom: var(--space-3);
  }

  :is(ul, ol) {
    margin: 0 0 var(--space-3) 1.5rem;
    padding-left: 0.5rem;
  }

  li {
    margin-bottom: 0.625rem;
  }

  li::marker {
    color: var(--color-text-secondary);
  }

  :is(strong, em) {
    color: inherit;
  }

  code {
    color: var(--color-text-primary);
    background: rgba(255, 248, 236, 0.08);
    border-radius: 0.375rem;
    padding: 0.08rem 0.35rem;
  }

  hr {
    border: 0;
    border-top: 1px solid var(--color-border);
    margin: var(--space-4) 0;
  }
`;

/**
 * @component PrivacyPolicy
 * @description Displays the privacy policy content from the locale-aware legal registry.
 *
 * @returns {JSX.Element} The PrivacyPolicy component.
 *
 * @example
 * <PrivacyPolicy />
 *
 * @markdownLoadingLogic
 * The component loads Markdown through `useLegalMarkdown`, which uses the app's
 * query layer plus cache/fallback content to keep the page resilient.
 */
const PrivacyPolicy: React.FC = () => {
  const {locale} = useI18n();
  const legalDocument = getLegalDocumentOrThrow('privacy-policy', locale);
  const {content, state, isShowingCachedContent} = useLegalMarkdown({
    url: legalDocument.publicPath,
    fallbackContent: legalDocument.fallbackContent,
  });
  const normalizedContent = stripLeadingMarkdownH1(content);
  
  return (
    <MarkdownContainer>
      <h1>Privacy Policy</h1>
      {state === 'loading' && !content ? (
        <p>Loading privacy policy…</p>
      ) : state === 'error' && !content ? (
        <>
          <p>
            Unable to load privacy policy right now. Please try refreshing. You
            can also open the raw policy at{' '}
            <a href={legalDocument.publicPath}>{legalDocument.publicPath}</a>.
          </p>
        </>
      ) : (
        <>
          {isShowingCachedContent ? (
            <p>
              Showing a cached copy due to a network issue. Refresh when you’re
              back online for the latest version.
            </p>
          ) : null}
          <LegalMarkdownRenderer markdown={normalizedContent} />
        </>
      )}
    </MarkdownContainer>
  );
};

export default PrivacyPolicy;
