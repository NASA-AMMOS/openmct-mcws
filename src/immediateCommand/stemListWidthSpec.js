import { stemListWidth } from './stemListWidth.js';

describe('stemListWidth', () => {
  const measure = (stem) => stem.length * 10;

  it('fits the widest stem plus padding and scrollbar room', () => {
    expect(stemListWidth(['AB', 'x'.repeat(30)], measure)).toBe(300 + 60);
  });

  it('clamps short dictionaries to the minimum usable width', () => {
    expect(stemListWidth(['A'], measure)).toBe(280);
    expect(stemListWidth([], measure)).toBe(280);
  });

  it('clamps very long stems to the maximum width', () => {
    expect(stemListWidth(['x'.repeat(100)], measure)).toBe(560);
  });
});
