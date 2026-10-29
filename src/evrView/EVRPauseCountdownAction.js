export const PAUSE_COUNTDOWN_ACTION_KEY = 'vista.evr.pause-countdown';

/**
 * Status-bar countdown shown while an EVR view is paused with a Pause
 * Timer configured (#506). The view provider owns the timer: it shows this
 * action (named with the remaining seconds) while counting down and hides
 * it otherwise. Invoking it cancels the countdown and leaves the table
 * paused, so resuming stays with the Play button.
 */
export default function EVRPauseCountdownAction() {
  return {
    name: 'Pause Countdown',
    key: PAUSE_COUNTDOWN_ACTION_KEY,
    description: 'Auto-resume countdown. Select to stay paused.',
    cssClass: 'icon-pause evr-pause-countdown labeled',
    showInStatusBar: true,
    group: 'view',
    isHidden: true,
    invoke: (objectPath, view) => {
      view.getViewContext()?.dismissPauseCountdown?.();
    },
    appliesTo: (objectPath, view) => {
      const domainObject = objectPath?.[0];

      if (!domainObject || domainObject.type !== 'vista.evrView' || !view?.getViewContext) {
        return false;
      }

      return view.getViewContext()?.type === 'telemetry-table';
    }
  };
}
