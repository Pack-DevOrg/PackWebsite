import React from "react";
import styled from "styled-components";

const EyebrowRow = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  color: rgba(243, 210, 122, 0.78);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
`;

const Index = styled.span`
  color: rgba(243, 210, 122, 0.5);
  font-variant-numeric: tabular-nums;
`;

const Rule = styled.span`
  width: 2.2rem;
  height: 1px;
  align-self: center;
  background: rgba(243, 210, 122, 0.3);
`;

interface SectionEyebrowProps {
  readonly index: string;
  readonly label: string;
}

/** Numbered editorial section kicker — "01 ── LIVE". */
const SectionEyebrow: React.FC<SectionEyebrowProps> = ({ index, label }) => (
  <EyebrowRow aria-hidden="true">
    <Index>{index}</Index>
    <Rule />
    <span>{label}</span>
  </EyebrowRow>
);

export default SectionEyebrow;
