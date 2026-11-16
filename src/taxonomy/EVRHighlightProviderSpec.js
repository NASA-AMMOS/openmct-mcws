import EVRHighlightProvider from './EVRHighlightProvider.js';

describe('the EVR highlight provider', () => {
  const TAXONOMY = {
    evrDefaultBackgroundColor: null,
    evrDefaultForegroundColor: null,
    evrBackgroundColorByLevel: {
      FATAL: '#ff0000',
      WARNING_HI: '#ff7f24',
      COMMAND: '#00bfff'
    },
    evrForegroundColorByLevel: {
      FATAL: '#ffffff',
      WARNING_HI: '#000000',
      COMMAND: '#ffffff'
    }
  };

  let provider;
  let limitEvaluator;

  beforeEach(() => {
    provider = new EVRHighlightProvider(TAXONOMY);
    limitEvaluator = provider.getLimitEvaluator({ type: 'vista.evr' });
  });

  it('applies to EVR types', () => {
    ['vista.evr', 'vista.evrModule', 'vista.evrSource'].forEach((type) => {
      expect(provider.supportsLimits({ type })).toBeTrue();
    });
  });

  it('does not apply to other types', () => {
    ['vista.channel', 'vista.dataProducts', 'vista.message'].forEach((type) => {
      expect(provider.supportsLimits({ type })).toBeFalse();
    });
  });

  it('returns background and foreground classes for each configured level', () => {
    expect(limitEvaluator.evaluate({ level: 'FATAL' }, undefined, undefined)).toEqual({
      cssClass: 'vista-evr-level-bg-fatal vista-evr-level-fg-fatal'
    });
    expect(limitEvaluator.evaluate({ level: 'WARNING_HI' }, undefined, undefined)).toEqual({
      cssClass: 'vista-evr-level-bg-warning_hi vista-evr-level-fg-warning_hi'
    });
  });

  it('returns default classes for levels missing from the taxonomy when defaults are set', () => {
    const providerWithDefaults = new EVRHighlightProvider({
      evrDefaultBackgroundColor: '#ababab',
      evrDefaultForegroundColor: '#121212',
      evrBackgroundColorByLevel: {},
      evrForegroundColorByLevel: {}
    });
    const evaluator = providerWithDefaults.getLimitEvaluator({ type: 'vista.evr' });

    expect(evaluator.evaluate({ level: 'DIAGNOSTIC' }, undefined, undefined)).toEqual({
      cssClass: 'vista-evr-default-bg vista-evr-default-fg'
    });
  });

  it('returns undefined for levels missing from the taxonomy without defaults', () => {
    expect(
      limitEvaluator.evaluate({ level: 'DIAGNOSTIC' }, undefined, undefined)
    ).not.toBeDefined();
  });

  it('returns undefined for datums without a level', () => {
    expect(limitEvaluator.evaluate({}, undefined, undefined)).not.toBeDefined();
  });

  it('filters out levels not enabled for the view', () => {
    expect(limitEvaluator.evaluate({ level: 'FATAL' }, undefined, ['COMMAND'])).not.toBeDefined();
    expect(limitEvaluator.evaluate({ level: 'FATAL' }, undefined, ['FATAL'])).toEqual({
      cssClass: 'vista-evr-level-bg-fatal vista-evr-level-fg-fatal'
    });
  });

  it('injects matching level styles into the document', () => {
    const styles = Array.from(document.querySelectorAll('style'))
      .map((element) => element.textContent)
      .join('\n');

    expect(styles).toContain('.vista-evr-level-bg-fatal');
    expect(styles).toContain('.vista-evr-level-fg-fatal');
  });
});
