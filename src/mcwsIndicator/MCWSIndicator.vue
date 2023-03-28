<template>
<div 
    class="c-indicator icon-database"
    :class="statusClass"
    :text="stateDescription"
>
    <span class="label c-indicator__label">
        {{ stateText }}
    </span>
</div>
</template>

<script>

import mcws from 'services/mcws/mcws';

const MCWS_PERSISTENCE_CHECK_NAMESPACE = '';
const MCWS_PERSISTENCE_CHECK_INTERVAL = 15000;
const CONNECTION_STATES = {
    CONNECTED: {
        text: "Connected",
        statusClass: "s-status-ok",
        description: "Connected to the domain object database."
    },
    DISCONNECTED: {
        text: "Disconnected",
        statusClass: "s-status-error",
        description: "Unable to connect to the domain object database."
    },
    PENDING: {
        text: "Checking connection..."
    }
};

export default {
    inject: ['openmct'],
    computed: {
        statusClass() {
            let mcwsState = this.state;

            return mcwsState.statusClass;
        },
        stateText() {
            let mcwsState = this.state;

            return mcwsState.text;
        },
        stateDescription() {
            let mcwsState = this.state;

            return mcwsState.description;
        }
    },
    data() {
        return {
            state: CONNECTION_STATES.PENDING,
            namespace: ''
        };
    },
    destroyed() {
        clearInterval(this.intervalId);
    },
    mounted() {
        this.namespace = mcws.namespace(MCWS_PERSISTENCE_CHECK_NAMESPACE);
        this.updateIndicator();
        this.intervalId = setInterval(this.updateIndicator, MCWS_PERSISTENCE_CHECK_INTERVAL);
    },
    methods: {
        updateIndicator() {
            this.namespace.read().then(
                () => { this.state = CONNECTION_STATES.CONNECTED; },
                () => { this.state = CONNECTION_STATES.DISCONNECTED; }
           );
        }
    }
};
</script>
