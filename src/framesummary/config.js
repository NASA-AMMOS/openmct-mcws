import padStart from 'lodash/padStart';

export const ENCODING_WATCH_TYPE = 'vista.encodingWatch';
export const FRAME_WATCH_TYPE = 'vista.frameWatch';
export const config = {
    'vista.encodingWatch': {
        summaryType: 'encoding_summaries',
        columns: [
            { key: 'vc_type', title: 'VC/Encoding Family' },
            { key: 'count', title: 'Frame Count' },
            { key: 'bad_count', title: 'Bad Frame Count' },
            { key: 'error_count', title: 'Error Count' },
            { key: 'last_seq', title: 'Last Sequence ID' },
            { key: 'last_ert', title: 'Last ERT' }
        ],
        createRowId: function(frameSummary) {
            return `${padStart(frameSummary.vcid, 3, 0)}/${frameSummary.encoding_type}`;
        },
        transformRow: function(frameSummary) {
            return {
                'vc_type': this.createRowId(frameSummary),
                'count': Number(frameSummary.instance_count),
                'bad_count': Number(frameSummary.bad_frame_count),
                'error_count': Number(frameSummary.error_count),
                'last_seq': Number(frameSummary.sequence_count),
                'last_ert': frameSummary.last_ert_time
            };
        }
    },
    'vista.frameWatch': {
        summaryType: 'frame_summaries',
        columns: [
            { key: 'vc_type', title: 'VC/Encoding Type' },
            { key: 'count', title: 'Frame Count' },
            { key: 'last_seq', title: 'Last Sequence ID' },
            { key: 'last_ert', title: 'Last ERT' }
        ],
        createRowId: function(frameSummary) {
            return `${frameSummary.vcid}/${frameSummary.frame_type}`;
        },
        transformRow: function(frameSummary) {
            return {
                'vc_type': this.createRowId(frameSummary),
                'count': Number(frameSummary.instance_count),
                'last_seq': Number(frameSummary.sequence_count),
                'last_ert': frameSummary.last_ert_time
            };
        }
    }
}
