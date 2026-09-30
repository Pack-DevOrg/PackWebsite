/**
 * Rim around the live screen. While Pack drives, two hot heads orbit 180°
 * apart with an outer bloom — the same rotate-mode beam as
 * PackApp BorderBeamRing's saffron palette (the yellow spin around the box).
 * While the user drives, a dim still rim. prefers-reduced-motion freezes it
 * to a static glow.
 */
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

import styles from "./LiveViewBeam.module.css";

type LiveViewBeamProps = {
  readonly active: boolean;
};

export function LiveViewBeam({ active }: LiveViewBeamProps) {
  if (active !== true) {
    return <div className={`live-view-beam-dim ${styles.dim ?? ""}`} aria-hidden="true" />;
  }
  return (
    <div className={`live-view-beam ${styles.root ?? ""}`} aria-hidden="true">
      <span className={styles.bloom} />
      <span className={styles.spin} />
    </div>
  );
}
