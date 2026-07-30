import VenueService from './VenueService.js';

export default function VISTAVenuePlugin(options) {
  if (!options.venueAware) {
    options.venueAware = {
      enabled: false
    };
  }

  return function install(openmct) {
    if (!options.venueAware.enabled) {
      return;
    }

    const configuration = options.venueAware;
    const venueService = new VenueService(configuration, openmct);

    openmct.objects.addRoot({
      namespace: 'vista-active',
      key: 'dataset'
    });

    openmct.objects.addProvider('vista-active', {
      get: async () => {
        const venue = await venueService.getSelectedVenue();
        const model = venue.getModel();

        model.identifier = {
          namespace: 'vista-active',
          key: 'dataset'
        };
        model.location = 'ROOT';

        return model;
      }
    });
  };
}
