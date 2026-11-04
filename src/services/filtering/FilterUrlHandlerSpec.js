import FilterURLHandler from './FilterUrlHandler.js';

describe('FilterURLHandler', () => {
  let openmct;
  let filterService;
  let searchParams;
  let paramsChangeCallback;
  let activeFilters;

  beforeEach(() => {
    searchParams = {};
    paramsChangeCallback = undefined;
    activeFilters = {};

    openmct = {
      router: {
        on: jasmine.createSpy('on').and.callFake((event, callback) => {
          if (event === 'change:params') {
            paramsChangeCallback = callback;
          }
        }),
        getSearchParam: (name) =>
          Object.prototype.hasOwnProperty.call(searchParams, name) ? searchParams[name] : null,
        setSearchParam: jasmine.createSpy('setSearchParam'),
        deleteSearchParam: jasmine.createSpy('deleteSearchParam')
      }
    };

    filterService = {
      on: jasmine.createSpy('on'),
      getAvailableFilters: () => ({ venue: {}, spacecraft: {} }),
      getActiveFilters: () => activeFilters,
      updateFilters: jasmine.createSpy('updateFilters')
    };
  });

  it('activates the global filter from the URL', () => {
    searchParams = { global_filter_venue: 'ops' };

    new FilterURLHandler(filterService, openmct);

    expect(filterService.updateFilters).toHaveBeenCalledWith({
      venue: { equals: 'ops' },
      spacecraft: {}
    });
  });

  it('replaces active global filters with the set from the URL on navigation', () => {
    activeFilters = { venue: { equals: 'ops' } };
    searchParams = { global_filter_venue: 'ops' };
    new FilterURLHandler(filterService, openmct);
    filterService.updateFilters.calls.reset();

    searchParams = { global_filter_spacecraft: 'sc1' };
    paramsChangeCallback();

    expect(filterService.updateFilters).toHaveBeenCalledWith({
      venue: {},
      spacecraft: { equals: 'sc1' }
    });
  });

  it('keeps active global filters when the URL has no global filter params', () => {
    activeFilters = { venue: { equals: 'ops' } };
    searchParams = {};

    new FilterURLHandler(filterService, openmct);

    expect(filterService.updateFilters).not.toHaveBeenCalled();
  });
});
