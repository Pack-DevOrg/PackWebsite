import React from "react";
import styled from "styled-components";
import PrefetchLink from "./PrefetchLink";
import { useI18n } from "@/i18n/I18nProvider";

const BOOK_NOW_CAPABILITY_SLUG = "travel-booking";

export function isBookNowCapability(slug: string): boolean {
  return slug === BOOK_NOW_CAPABILITY_SLUG;
}

const BookNowLink = styled(PrefetchLink)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.45);
  background: rgba(243, 210, 122, 0.12);
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.85);
    background: rgba(243, 210, 122, 0.2);
  }
`;

const BookNowCta: React.FC = () => {
  const { pathFor } = useI18n();

  return (
    <BookNowLink to={pathFor("/app")} data-testid="book-now-cta">
      Book now
    </BookNowLink>
  );
};

export default BookNowCta;
