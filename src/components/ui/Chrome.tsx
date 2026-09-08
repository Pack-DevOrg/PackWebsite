import React from 'react';
import styled, {css} from 'styled-components';

export type ButtonVariant = 'primary' | 'ghost' | 'glow' | 'destructive';

function defaultButtonVariantBecausePrimary(
  variant: ButtonVariant | undefined,
): ButtonVariant {
  if (variant === undefined) {
    return 'primary';
  }
  return variant;
}

function defaultButtonTypeBecauseSafe(
  type: React.ButtonHTMLAttributes<HTMLButtonElement>['type'] | undefined,
): React.ButtonHTMLAttributes<HTMLButtonElement>['type'] {
  if (type === undefined) {
    return 'button';
  }
  return type;
}

function defaultCloseGlyphBecauseDismiss(
  children: React.ReactNode | undefined,
): React.ReactNode {
  if (children !== undefined) {
    return children;
  }
  return '×';
}

function iconDiscFillBecauseTint(color: string | undefined): string {
  if (color === undefined) {
    return 'color-mix(in srgb, var(--color-accent) 12%, transparent)';
  }
  return `${color}1F`;
}

function iconDiscStrokeBecauseTint(color: string | undefined): string {
  if (color === undefined) {
    return 'color-mix(in srgb, var(--color-accent) 20%, transparent)';
  }
  return `${color}33`;
}

function iconDiscGlyphBecauseAccent(color: string | undefined): string {
  if (color === undefined) {
    return 'var(--color-accent)';
  }
  return color;
}

export const Card = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: none;
  backdrop-filter: none;
`;

const Disc = styled.div<{ $fill: string; $stroke: string; $glyph: string }>`
  width: 32px;
  height: 32px;
  border-radius: var(--radius-disc);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${(props) => props.$fill};
  border: 1px solid ${(props) => props.$stroke};
  color: ${(props) => props.$glyph};
`;

export interface IconDiscProps {
  color?: string;
  children?: React.ReactNode;
}

export function IconDisc({color, children}: IconDiscProps) {
  return (
    <Disc
      $fill={iconDiscFillBecauseTint(color)}
      $stroke={iconDiscStrokeBecauseTint(color)}
      $glyph={iconDiscGlyphBecauseAccent(color)}>
      {children}
    </Disc>
  );
}

const CloseRoot = styled.button`
  width: 34px;
  height: 34px;
  border-radius: var(--radius-disc);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  cursor: pointer;
  background: var(--color-background-subtle);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  font-size: 1rem;
  line-height: 1;
`;

export interface CloseButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
}

export function CloseButton({onClick, children}: CloseButtonProps) {
  return (
    <CloseRoot type="button" onClick={onClick} aria-label="Close">
      {defaultCloseGlyphBecauseDismiss(children)}
    </CloseRoot>
  );
}

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-align: left;
`;

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text-primary);
`;

const HeaderSubtitle = styled.p`
  margin: 0.125rem 0 0;
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
`;

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accessory?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  discColor?: string;
}

export function PageHeader({
  title,
  subtitle,
  accessory,
  onClose,
  children,
  discColor,
}: PageHeaderProps) {
  return (
    <HeaderRow>
      {children !== undefined ? (
        <IconDisc color={discColor}>{children}</IconDisc>
      ) : null}
      <HeaderText>
        <HeaderTitle>{title}</HeaderTitle>
        {subtitle !== undefined ? (
          <HeaderSubtitle>{subtitle}</HeaderSubtitle>
        ) : null}
      </HeaderText>
      {accessory}
      {onClose !== undefined ? <CloseButton onClick={onClose} /> : null}
    </HeaderRow>
  );
}

const buttonVariantCss = {
  primary: css`
    background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-soft) 100%);
    color: var(--color-text-on-accent);
    border: 1px solid var(--color-accent);
  `,
  ghost: css`
    background: transparent;
    color: var(--color-accent);
    border: 1px solid var(--color-accent);
  `,
  glow: css`
    background: var(--color-surface);
    color: var(--color-accent);
    border: 1px solid var(--color-accent);
  `,
  destructive: css`
    background: var(--color-error);
    color: var(--color-text-on-secondary);
    border: 1px solid var(--color-error);
  `,
};

const StyledButton = styled.button<{ $variant: ButtonVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: var(--radius-l);
  padding: var(--space-2) var(--space-3);
  min-height: 2.5rem;
  ${(props) => buttonVariantCss[props.$variant]}
`;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function Button({variant, type, children, ...rest}: ButtonProps) {
  return (
    <StyledButton
      $variant={defaultButtonVariantBecausePrimary(variant)}
      type={defaultButtonTypeBecauseSafe(type)}
      {...rest}>
      {children}
    </StyledButton>
  );
}

export const MicroLabel = styled.span`
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
`;
