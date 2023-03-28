<template>
<div class="h-indicator">
    <div class="c-indicator icon-clock"
        :class="cssClass"
    >
        <span class="label c-indicator__label"   
    >{{currentValue.text}}</span>
    </div>
</div>
</template>

<script>
const UTC_DEFAULT_FORMAT = openmctMCWSConfig.time.utcFormat;
export default {
    inject: [
        'openmct',
        'vistaTime'
    ],
    data() {
        return {
            currentValue: {
                text: 'Last real-time display update: never', 
                cssClass: ''
            },
        }
    },
    methods: {
        isRefreshRateNominal(newTimestamp, lastTimestamp) {
            if (newTimestamp - lastTimestamp <= 100) {
                return true;
            }
            return false;
        },
        setTick() {
            try {
                let timestamp = new Date();
                if (this.isRefreshRateNominal(timestamp, this.lastTimestamp)) {
                    this.currentValue = {
                        text: 'Data Rate is higher than 10hz, display may update less than once per second',
                        cssClass: 's-status-caution'
                    };
                } else {
                    let formattedTimestamp =  this.format.format(new Date());

                    this.currentValue = {
                        text: 'Last real-time display update: ' + formattedTimestamp,
                        cssClass: 's-status-on'
                    }
                };
                this.lastTimestamp = timestamp;
            } catch (e) {
                // don't break.
            }
        }
    },
    computed: {
        cssClass() {
            let className = this.currentValue['cssClass'];
            let classObject = {};
            classObject[className] = className.length > 0;
            return classObject;
        }
    },
    mounted() {
            this.lastTimestamp = new Date();
            this.format = this.openmct.telemetry.getFormatter(UTC_DEFAULT_FORMAT);

            if (this.vistaTime.ladClocks.ert) {
                this.vistaTime.ladClocks.ert.on('tick', this.setTick.bind(this));
            }
    },
    beforeDestroy() {
        if (this.vistaTime.ladClocks.ert) {
            this.vistaTime.ladClocks.ert.off('tick', this.setTick.bind(this));
        }
    }
}
</script>

