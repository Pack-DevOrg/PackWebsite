import styled from 'styled-components';
import {useI18n} from '../i18n/I18nProvider';
import {getLegalDocumentOrThrow} from '../legal/legalDocuments';
import {useLegalMarkdown} from './useLegalMarkdown';

const SECTION_TITLES = new Set([
  'Acceptance of Terms',
  'The Service',
  'Travel Bookings, Partners, DOT, and Accessibility',
  'Transportation Security Administration (“TSA”) Wait Times and Other Travel Information',
  'Accounts and Google Sign-In',
  'Acceptable Use',
  'User Submissions',
  'Intellectual Property and Ownership',
  'Notice of Infringement – DMCA Policy',
  'Feedback',
  'Third-Party Services and Links',
  'Privacy',
  'AI Outputs Disclaimer',
  'Disclaimers',
  'Limitation of Liability',
  'Indemnification',
  'Termination',
  'Arbitration and Dispute Resolution',
  'Governing Law and Miscellaneous',
  'Contact',
]);

const DocumentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-4) 0;
  line-height: 1.6;
  color: var(--color-text-primary);
  font-family: var(--font-body);
`;

const PageTitle = styled.h1`
  margin: 0 0 var(--space-2);
  color: var(--color-text-primary);
`;

const EffectiveDate = styled.p`
  margin: 0 0 var(--space-5);
  color: rgba(247, 240, 227, 0.9);
  font-size: var(--font-size-base);
`;

const SectionTitle = styled.h2`
  margin: var(--space-5) 0 var(--space-2);
  color: var(--color-text-primary);
  line-height: 1.2;
`;

const Paragraph = styled.p`
  margin: 0 0 var(--space-3);
  color: rgba(247, 240, 227, 0.9);
  font-size: var(--font-size-base);
  line-height: 1.7;
`;

function renderTermsContent(content: string): React.ReactNode {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return null;
  }

  const blocks = normalized.split(/\n{2,}/);
  const [title = '', effectiveDate = ''] = blocks[0]?.split('\n') ?? [];
  const nodes: React.ReactNode[] = [];

  if (title) {
    nodes.push(<PageTitle key="title">{title}</PageTitle>);
  }

  if (effectiveDate) {
    nodes.push(<EffectiveDate key="effective-date">{effectiveDate}</EffectiveDate>);
  }

  blocks.slice(1).forEach((block, blockIndex) => {
    const lines = block.split('\n').filter(Boolean);
    if (lines.length === 0) {
      return;
    }

    const [firstLine, ...restLines] = lines;
    const keyBase = `block-${blockIndex}`;

    if (SECTION_TITLES.has(firstLine)) {
      nodes.push(<SectionTitle key={`${keyBase}-title`}>{firstLine}</SectionTitle>);
      restLines.forEach((line, lineIndex) => {
        nodes.push(
          <Paragraph key={`${keyBase}-line-${lineIndex}`}>{line}</Paragraph>,
        );
      });
      return;
    }

    lines.forEach((line, lineIndex) => {
      nodes.push(<Paragraph key={`${keyBase}-line-${lineIndex}`}>{line}</Paragraph>);
    });
  });

  return nodes;
}
const TermsOfService: React.FC = () => {
  const {locale} = useI18n();
  const legalDocument = getLegalDocumentOrThrow('terms-of-service', locale);
  const {content, state, isShowingCachedContent} = useLegalMarkdown({
    url: legalDocument.publicPath,
    fallbackContent: legalDocument.fallbackContent,
  });
  
  return (
    <DocumentContainer aria-label="Terms of Service">
      {state === 'loading' && !content ? (
        <Paragraph>Loading terms of service…</Paragraph>
      ) : state === 'error' && !content ? (
        <Paragraph>
          Unable to load terms of service right now. Please try refreshing. You
          can also open the raw terms at{' '}
          <a href={legalDocument.publicPath}>{legalDocument.publicPath}</a>.
        </Paragraph>
      ) : (
        <>
          {isShowingCachedContent ? (
            <Paragraph>
              Showing a cached copy due to a network issue. Refresh when you’re
              back online for the latest version.
            </Paragraph>
          ) : null}
          {renderTermsContent(content)}
        </>
      )}
    </DocumentContainer>
  );
};

export default TermsOfService;
