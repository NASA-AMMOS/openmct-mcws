export default function getVistaTime(
    {
        options,
        format
    }
) {

    return {
        ladClocks: options.ladClocks,
        timeSystems: options.timeSystems,
        update: function (datum) {
            if (options.ladClocks.ert) {
                if (datum.ert) {
                    options.ladClocks.ert.tick(format.parse(datum.ert));
                } else if (datum.last_ert_time) {
                    options.ladClocks.ert.tick(format.parse(datum.last_ert_time));
                }
            }
            if (options.ladClocks.scet) {
                if (datum.scet) {
                    options.ladClocks.scet.tick(format.parse(datum.scet));
                } else if (datum.last_scet_time) {
                    options.ladClocks.scet.tick(format.parse(datum.last_scet_time));
                }
            }
            if (options.ladClocks.sclk) {
                if (datum.sclk) {
                    options.ladClocks.sclk.tick(Number(datum.sclk));
                } else if (datum.last_sclk_time) {
                    options.ladClocks.sclk.tick(Number(datum.last_sclk_time));
                }
            }
            // console.log('timeupdate!', datum);
            // TODO: Update timestamps based on received values.
        }
    };
}
