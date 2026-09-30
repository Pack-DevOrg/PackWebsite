import styles from "./LiveViewBeam.module.css";

/** On the rim only while Pack is driving. Tests look for this literal class. */
export const LIVE_VIEW_BEAM_CLASS = "live-view-beam";

/**
 * CSS port of PackApp BorderBeamRing mode "rotate": two saffron heads orbit
 * 180 degrees apart. While the user drives, a dim still rim and no spin.
 * prefers-reduced-motion freezes the orbit into a static glow in the CSS module.
 */
export function LiveViewBeam({ active }: { readonly active: boolean }) {
  const paint = active ? styles.orbit : styles.dim;
  const className = [paint, active ? LIVE_VIEW_BEAM_CLASS : ""]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
  return <div className={className} aria-hidden="true" />;
}
