import DataProductCell from './DataProductCell.js'

export default {
    extends: DataProductCell,
    template: `
        <td class="c-data-products-cell-content">
            <a
                v-if="formattedValue"
                @click.stop="preview('.emd')"
                class="icon-eye-open
                c-click-link"
                title="View File"
            >
                <span class="c-click-link__label">View</span>
            </a>
        </td>
    `
}
