###


* Need to fix location handling in OpenMCT

* need to implement new clock handling
* need to implement new MCWS persistence details

* implement EVRS
* implement login window wrapper.
* re-implement telemetry providers


* [ ] Search navigation broken?  (search composition?)
* [ ] Tree nav slow due to huge number of nodes (zzz)
* [ ] Fix clocks for realtime.



# Did I get this right? (check later)

Relationship between dictionary parsing and everything else...

I'd like the following methods:

getDataset(identifer)
    .then(function (dataset) {
        return dataset.getChannels()
    })
    .then(function (channels) {
        return channels.modules
    });

getDataset(identifer)
    .then(function (dataset) {
        return dataset.getChannels()
    })
    .then(function (channels) {
        return channels[id];
    });


getChannel(id)

