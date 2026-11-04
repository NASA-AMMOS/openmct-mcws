import ChannelTableSetConfiguration from './ChannelTableSetConfiguration.vue';
import mount from 'ommUtils/mountVueComponent.js';

describe('ChannelTableSetConfiguration', () => {
  let element;
  let destroyFn = null;
  let updateSpy;
  let configuration;

  function mountConfig(isEditing, initialConfiguration) {
    configuration = { ...initialConfiguration };
    updateSpy = jasmine.createSpy('updateConfiguration');

    element = document.createElement('div');
    const { destroy } = mount(
      {
        provide: {
          openmct: {
            editor: {
              isEditing: () => isEditing,
              on() {},
              off() {}
            }
          },
          tableConfiguration: {
            getConfiguration: () => configuration,
            updateConfiguration: (...args) => updateSpy(...args),
            destroy() {}
          }
        },
        components: {
          ChannelTableSetConfiguration
        },
        template: '<ChannelTableSetConfiguration ref="config" />'
      },
      {
        element
      }
    );
    destroyFn = destroy;
  }

  afterEach(() => {
    destroyFn?.();
    destroyFn = null;
  });

  it('renders layout controls without a columns section', () => {
    mountConfig(true, { autosize: true, hideHeaders: false });

    expect(element.querySelector('#AutoSizeControl')).not.toBe(null);
    expect(element.querySelector('#header-visibility')).not.toBe(null);
    expect(element.textContent).not.toMatch(/columns/i);
  });

  it('persists autosize and header visibility toggles', () => {
    mountConfig(true, { autosize: true, hideHeaders: false });

    // Programmatic .click() toggles without firing change in headless
    // Chrome, so drive the handler the way a real toggle would.
    const autosizeBox = element.querySelector('#AutoSizeControl');
    autosizeBox.checked = false;
    autosizeBox.dispatchEvent(new Event('change', { bubbles: true }));

    expect(updateSpy).toHaveBeenCalledWith({ autosize: false, hideHeaders: false });

    const headerBox = element.querySelector('#header-visibility');
    headerBox.checked = true;
    headerBox.dispatchEvent(new Event('change', { bubbles: true }));

    expect(updateSpy).toHaveBeenCalledWith({ autosize: false, hideHeaders: true });
  });

  it('shows state labels instead of controls while browsing', () => {
    mountConfig(false, { autosize: true, hideHeaders: true });

    expect(element.querySelector('#AutoSizeControl')).toBe(null);
    expect(element.querySelector('#header-visibility')).toBe(null);
    expect(element.textContent).toMatch(/Enabled/);
    expect(element.textContent).toMatch(/True/);
  });
});
