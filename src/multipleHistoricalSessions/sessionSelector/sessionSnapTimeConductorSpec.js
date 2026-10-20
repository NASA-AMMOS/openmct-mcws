import SessionSnapTimeConductor from './sessionSnapTimeConductor.vue';
import mount from 'ommUtils/mountVueComponent.js';

function mockTimeContext() {
  return {
    getBounds: () => ({ start: 0, end: 0 }),
    on: () => {},
    off: () => {}
  };
}

describe('SessionSnapTimeConductor', () => {
  let openmct;
  let element;
  let wrapper;
  let snap;

  beforeEach(() => {
    openmct = {
      time: {
        getTimeSystem: () => ({
          key: 'ert',
          timeFormat: 'utc',
          durationFormat: 'duration',
          isUTCBased: true
        }),
        getContextForView: () => mockTimeContext(),
        isFixed: () => true,
        on: () => {},
        off: () => {}
      },
      telemetry: {
        getFormatter: () => ({
          parse: Number,
          format: String
        })
      }
    };
    element = document.createElement('div');
    document.body.appendChild(element);

    wrapper = mount(
      {
        provide: {
          openmct
        },
        components: {
          SessionSnapTimeConductor
        },
        data() {
          return {
            sessions: []
          };
        },
        template: '<SessionSnapTimeConductor ref="snap" :sessions="sessions" />'
      },
      {
        element
      }
    );

    snap = wrapper.componentInstance.$refs.snap;
  });

  afterEach(() => {
    wrapper?.destroy();
    element.remove();
  });

  // A leading template comment makes this component fragment-rooted, in which
  // case $el is the comment node and any $el-based containment check always
  // fails (every document click closed the popup, including clicks on the
  // readout itself). These two specs pin the single-root shape.
  it('renders the holder div as its single root element', () => {
    expect(snap.$el).toBeInstanceOf(HTMLDivElement);
    expect(snap.$el.classList.contains('c-snap-tc')).toBeTrue();
  });

  it('binds the holder ref to the root element', () => {
    expect(snap.$refs.snapHolder).toBe(snap.$el);
  });

  // Core themes define a global .disabled rule with pointer-events:none,
  // which would swallow the hover tooltip; the holder must use the namespaced
  // class instead. No sessions are selected here, so the toggle is disabled.
  it("marks the disabled holder without core's global disabled class", () => {
    expect(snap.isDisabled).toBeTrue();
    expect(snap.$el.classList.contains('c-snap-tc--disabled')).toBeTrue();
    expect(snap.$el.classList.contains('disabled')).toBeFalse();
  });

  describe('handleClickAway', () => {
    let closePopupSpy;

    beforeEach(() => {
      closePopupSpy = spyOn(snap, 'closePopup');
    });

    it('keeps the popup open for clicks inside the holder', () => {
      const inside = snap.$refs.snapHolder.querySelector('.c-toggle-switch');

      snap.handleClickAway({ target: inside });

      expect(closePopupSpy).not.toHaveBeenCalled();
    });

    it('closes the popup for clicks outside the holder', () => {
      snap.handleClickAway({ target: document.createElement('div') });

      expect(closePopupSpy).toHaveBeenCalled();
    });
  });

  describe('hover text', () => {
    it('reads Snap Time Conductor when no sessions are selected', () => {
      expect(snap.hoverText).toBe('Snap Time Conductor');
    });

    it('reads Not available in realtime when the conductor is not fixed', async () => {
      openmct.time.isFixed = () => false;
      snap.handleModeChanged();

      expect(snap.hoverText).toBe('Not available in realtime');
    });
  });

  describe('readout keyboard access', () => {
    it('opens the popup on Enter and Space keydowns', async () => {
      snap.snapEnabled = true;
      await snap.$nextTick();

      const readout = snap.$el.querySelector('.c-snap-tc__readout');
      const openPopupSpy = spyOn(snap, 'openPopup');

      expect(readout.getAttribute('tabindex')).toBe('0');

      readout.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      readout.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

      expect(openPopupSpy).toHaveBeenCalledTimes(2);
    });
  });
});
