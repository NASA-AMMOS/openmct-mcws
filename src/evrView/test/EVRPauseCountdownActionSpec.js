import EVRPauseCountdownAction, { PAUSE_COUNTDOWN_ACTION_KEY } from '../EVRPauseCountdownAction.js';

describe('EVRPauseCountdownAction', () => {
  const evrViewObject = [{ type: 'vista.evrView' }];
  const tableView = {
    getViewContext: () => ({ type: 'telemetry-table', dismissPauseCountdown: () => {} })
  };

  it('is a hidden status-bar view action using the paused play styling', () => {
    const action = EVRPauseCountdownAction();

    expect(action.key).toBe(PAUSE_COUNTDOWN_ACTION_KEY);
    expect(action.showInStatusBar).toBe(true);
    expect(action.group).toBe('view');
    expect(action.isHidden).toBe(true);
    expect(action.cssClass).toContain('icon-pause');
    expect(action.cssClass).toContain('evr-pause-countdown');
    expect(action.cssClass).not.toContain('pause-play');
  });

  it('applies only to telemetry-table contexts of EVR views', () => {
    const action = EVRPauseCountdownAction();

    expect(action.appliesTo(evrViewObject, tableView)).toBe(true);
    expect(action.appliesTo([{ type: 'vista.evr' }], tableView)).toBe(false);
    expect(action.appliesTo(evrViewObject, { getViewContext: () => ({ type: 'plot' }) })).toBe(
      false
    );
    expect(action.appliesTo(evrViewObject, undefined)).toBe(false);
    expect(action.appliesTo(undefined, tableView)).toBe(false);
  });

  it('invokes the view dismiss hook and tolerates its absence', () => {
    const action = EVRPauseCountdownAction();
    const dismissPauseCountdown = jasmine.createSpy('dismissPauseCountdown');

    action.invoke(evrViewObject, {
      getViewContext: () => ({ dismissPauseCountdown })
    });
    expect(dismissPauseCountdown).toHaveBeenCalledTimes(1);

    expect(() => action.invoke(evrViewObject, { getViewContext: () => ({}) })).not.toThrow();
  });
});
