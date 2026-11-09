import SCLKTimeSystem from './SCLKTimeSystem.js';

describe('SCLKTimeSystem', () => {
  it('is named just sclk (#508)', () => {
    const system = new SCLKTimeSystem();

    expect(system.key).toBe('sclk');
    expect(system.name).toBe('sclk');
    expect(system.timeFormat).toBe('sclk.float64');
  });
});
