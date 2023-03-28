import DataProductCell from './DataProductCell.js'

export default {
    extends: DataProductCell,
    template: `
        <td class="c-data-products-cell-content">
            <a
                v-if="formattedValue"
                @click.stop
                :href="formattedValue"
                class="c-click-link icon-download"
                title="Download .EMD File"
                download
            >
                <span class="c-click-link__label">Download</span>
            </a>
        </td>
    `
}
