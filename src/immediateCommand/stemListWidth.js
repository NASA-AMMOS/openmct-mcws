const MIN_LIST_WIDTH = 280;
const MAX_LIST_WIDTH = 560;
const WIDTH_ALLOWANCE = 60;

/**
 * Sidebar width that fits the widest stem: the widest measured stem
 * plus room for sidebar/button padding and the list scrollbar,
 * clamped to usable bounds. `measureText` maps a stem to its width in
 * pixels (canvas measureText in the component, stubbed in tests).
 */
export function stemListWidth(stems, measureText) {
  const widest = (stems || []).reduce((max, stem) => Math.max(max, measureText(stem)), 0);

  return Math.min(Math.max(Math.ceil(widest) + WIDTH_ALLOWANCE, MIN_LIST_WIDTH), MAX_LIST_WIDTH);
}
