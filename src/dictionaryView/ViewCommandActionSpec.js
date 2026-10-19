import ViewCommandAction, { VIEW_COMMAND_ACTION_KEY } from './ViewCommandAction.js';

describe('ViewCommandAction', () => {
  let openmct;
  let action;

  function commandObject() {
    return {
      type: 'vista.command',
      identifier: {
        namespace: 'vista',
        key: 'command:test-dataset:MY_CMD'
      }
    };
  }

  function rowView() {
    return {
      getViewContext: () => ({
        row: {}
      })
    };
  }

  beforeEach(() => {
    openmct = {
      objects: {
        makeKeyString: (identifier) => `${identifier.namespace}:${identifier.key}`
      },
      router: {
        navigate: jasmine.createSpy('navigate')
      }
    };
    action = new ViewCommandAction(openmct);
  });

  it('keeps the View Full Datum menu entry', () => {
    expect(action.key).toBe(VIEW_COMMAND_ACTION_KEY);
    expect(action.key).toBe('vista.viewCommand');
    expect(action.name).toBe('View Full Datum');
  });

  it('applies to command objects from a table row context', () => {
    expect(action.appliesTo([commandObject()], rowView())).toBeTrue();
  });

  it('does not apply to non-command objects', () => {
    const channel = {
      type: 'vista.channel',
      identifier: { namespace: 'vista', key: 'channel:test:CH1' }
    };

    expect(action.appliesTo([channel], rowView())).toBeFalse();
  });

  it('does not apply without a row context', () => {
    expect(action.appliesTo([commandObject()], { getViewContext: () => ({}) })).toBeFalse();
    expect(action.appliesTo([commandObject()], {})).toBeFalse();
  });

  it('does not apply with an empty object path', () => {
    expect(action.appliesTo([], rowView())).toBeFalse();
  });

  it('navigates to the command object', () => {
    action.invoke([commandObject()]);

    expect(openmct.router.navigate).toHaveBeenCalledWith(
      '#/browse/vista:command:test-dataset:MY_CMD'
    );
  });
});
