<template>
<div class="h-indicator">
    <div :class="[
            'c-indicator',
            'c-indicator--clickable',
            's-status-caution',
            globalStalenessMessage ? 'icon-database' : 'icon-clear-data'
        ]"
    >
        <span class="label c-indicator__label">
            {{ globalStalenessMessage }}
            <button 
                @click="clearData"
            >
                Clear Data
            </button>
        </span>
    </div>
</div>
</template>

<script>
import Moment from 'moment';

export default {
    inject: [
        'openmct',
        'globalStalenessMs'
    ],
    data() {
        return {
            globalStalenessMessage: ''
        }
    },
    methods: {
        formatTimestamp(ms) {
            let duration = Moment.duration(ms, 'milliseconds');
            let hours = this.padTime(Math.floor(duration.asHours()));
            let minutes = this.padTime(Math.floor(duration.minutes()));
            let seconds = this.padTime(Math.floor(duration.seconds()));
            let formattedTimestamp = `${hours}:${minutes}:${seconds}`;

            return formattedTimestamp;
        },
        padTime(time) {
            if (time < 10) {
                return `0${time}`
            } else {
                return `${time}`
            }
        },
        clearData() {
            this.openmct.objectViews.emit('clearData');
            this.openmct.notifications.info('Data Cleared On All Displays');
        }
    },
    mounted() {
        if (this.globalStalenessMs) {
            let formattedTimestamp = this.formatTimestamp(this.globalStalenessMs);
            this.globalStalenessMessage = `Data stale after ${formattedTimestamp}`;
        }
    }
}
</script>
