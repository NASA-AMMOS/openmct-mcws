<template>
<div class="l-preview-window"
     :class="{loading: isLoading}"
>
    <div
        v-if="rowsLength"
        class="l-preview-window__object-view l-preview-window__object-view-no-padding"
    >
            <telemetry-table
                :marking="markingProp"
                :enableLegacyToolbar="true"
            >
                <div class="c-table-and-summary__summary">
                    <div class="c-table-and-summary__summary-item">
                        DataTable URL:
                        <em> {{ url }} </em>
                    </div>
                    <div class="c-table-and-summary__summary-item">
                        Returned:
                        <em>{{rowsLength}} rows</em>
                    </div>
                </div>
            </telemetry-table>
    </div>
    <div
        v-if="error"
        class="message block error"
    >
        <h2>Error Received From Server:</h2>
        <pre><code>{{ error.status }} : {{ error.statusText}}</code></pre>
    </div>
</div>
</template>

<script>
import TelemetryTable from 'openmct.tables.components.Table';

export default {
    inject: [
        'openmct',
        'domainObject',
        'table',
        'objectPath',
        'currentView',
    ],
    components: {
        TelemetryTable
    },
    data() {
        return {
            headers: [],
            rows: [],
            rowsLength: undefined,
            isLoading: false,
            url: this.domainObject.dataTablePath,
            markingProp: {
                enable: true,
                useAlternateControlBar: false,
                rowName: "",
                rowNamePlural: ""
            },
            error: undefined
        }
    },
    methods: {
        processData(data) {
            this.populateTable(data);
        },
        processError(errorObject) {
            this.error = {
                statusText: errorObject.statusText,
                status: errorObject.status
            };
            this.isLoading = false;
        },
        populateTable(data) {
            this.headers = this.processHeaders(data[0]);
            this.rows = this.processRows(data);

            this.table.metadata = this.headers;
            this.table.data = this.rows;
            this.isLoading = false;
        },
        processHeaders(row) {
            return Object.keys(row).map((key => {
                return {
                    name: key,
                    key: key,
                    source: key
                }
            }));
        },
        processRows(data) {
           return data;
        }
    },
    mounted() {
        this.isLoading = true;

        this.table.loadDictionary().then(() => {
            this.rowsLength = this.table.tableRows.getRowsLength();
            this.error = this.table.error;
            this.isLoading = false;
        });
    }
}
</script>
