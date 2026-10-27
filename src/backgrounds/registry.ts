/**
 * Single source of truth for the mapping between style names and Vite entry files.
 *
 * Why: Each background is a separate Vite entry (its own HTML + TSX bundle).
 * The Rust scheduler picks the right entry from this map. Adding a new
 * background = append a row here + drop one HTML/TSX file pair + register
 * the entry in vite.config.ts.
 *
 * Format: `"aurora" -> "reminder-aurora.html"`. The Vite input must match
 * the `entry_name` field in vite.config.ts.
 */

export type BackgroundStyle =
  | "default"
  | "aurora"
  | "freesprit"
  | "beamoflife"
  | "particleBackground"
  | "starryBackground"
  | "shootingmeteor"
  | "plainGradientAnimation"
  | "canvasShapes";

export interface BackgroundEntry {
  /** Style key persisted in appconfig.db (`reminderBackgroundStyle`). */
  style: BackgroundStyle;
  /** Vite/Rollup input filename. */
  entry: string;
  /** Display label for the style picker UI. */
  label: string;
}

export const BACKGROUND_REGISTRY: BackgroundEntry[] = [
  { style: "default",               entry: "reminder-default.html",             label: "默认" },
  { style: "aurora",                entry: "reminder-aurora.html",              label: "极光" },
  { style: "freesprit",             entry: "reminder-freesprit.html",           label: "自由灵魂" },
  { style: "beamoflife",            entry: "reminder-beamoflife.html",          label: "生命之光" },
  { style: "particleBackground",    entry: "reminder-particles.html",           label: "粒子波浪" },
  { style: "starryBackground",      entry: "reminder-starry.html",              label: "星空背景" },
  { style: "shootingmeteor",        entry: "reminder-meteor.html",              label: "流星" },
  { style: "plainGradientAnimation", entry: "reminder-gradient.html",          label: "渐变动画" },
  { style: "canvasShapes",          entry: "reminder-canvas.html",              label: "弹跳小球" },
];

export const DEFAULT_BACKGROUND_ENTRY = "reminder-default.html";

/** Look up the entry filename for a given style. Falls back to default. */
export function entryForStyle(style: string | null | undefined): string {
  const match = BACKGROUND_REGISTRY.find((b) => b.style === style);
  return match ? match.entry : `${DEFAULT_BACKGROUND_ENTRY}`;
}

/** Ensure style is in the registry; return canonical key or "default". */
export function normalizeStyle(style: string | null | undefined): BackgroundStyle {
  const found = BACKGROUND_REGISTRY.find((b) => b.style === style);
  return (found?.style ?? "default") as BackgroundStyle;
}
