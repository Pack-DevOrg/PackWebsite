import styled from 'styled-components';
import LegalMarkdownRenderer from '../components/LegalMarkdownRenderer';
import {useTracking} from '../components/TrackingProvider';
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

const ActionCard = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: var(--space-4);
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
`;

const ActionCopy = styled.p`
  margin: 0;
  color: rgba(247, 240, 227, 0.88);
  flex: 1 1 18rem;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
  cursor: pointer;
  color: #0f0f0f;
  background: linear-gradient(135deg, #f0c62d 0%, #f7d768 100%);
`;

const DoNotSell: React.FC = () => {
  const {openPrivacyPreferences} = useTracking();
  const {locale} = useI18n();
  const legalDocument = getLegalDocumentOrThrow('do-not-sell', locale);
  const {content, state, isShowingCachedContent} = useLegalMarkdown({
    url: legalDocument.publicPath,
    fallbackContent: legalDocument.fallbackContent,
  });
  const normalizedContent = stripLeadingMarkdownH1(content);

  return (
    <MarkdownContainer>
      <h1>Do Not Sell or Share My Personal Information</h1>
      <ActionCard>
        <ActionCopy>
          Want to adjust analytics or advertising cookies for this browser right
          now? Update your privacy choices without leaving this page.
        </ActionCopy>
        <ActionButton type="button" onClick={openPrivacyPreferences}>
          Manage Browser Preferences
        </ActionButton>
      </ActionCard>
      {state === 'loading' && !content ? (
        <p>Loading…</p>
      ) : state === 'error' && !content ? (
        <p>
          Unable to load this page right now. Please try refreshing. You can
          also open the raw notice at{' '}
          <a href={legalDocument.publicPath}>{legalDocument.publicPath}</a>.
        </p>
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

export default DoNotSell;
