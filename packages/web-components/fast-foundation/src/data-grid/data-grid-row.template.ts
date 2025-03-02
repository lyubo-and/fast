import { children, elements, html, slotted } from "@microsoft/fast-element";
import type { ViewTemplate } from "@microsoft/fast-element";
import type { FoundationElementTemplate } from "../foundation-element";
import type { DataGridRow } from "./data-grid-row";
import { DataGridCell } from "./data-grid-cell";

function createCellItemTemplate(context): ViewTemplate {
    const cellTag = context.tagFor(DataGridCell);
    return html`
    <${cellTag}
        cell-type="${x => (x.isRowHeader ? "rowheader" : undefined)}"
        grid-column="${(x, c) => c.index + 1}"
        :rowData="${(x, c) => c.parent.rowData}"
        :columnDefinition="${x => x}"
    ></${cellTag}>
`;
}

function createHeaderCellItemTemplate(context): ViewTemplate {
    const cellTag = context.tagFor(DataGridCell);
    return html`
    <${cellTag}
        cell-type="columnheader"
        grid-column="${(x, c) => c.index + 1}"
        :columnDefinition="${x => x}"
    ></${cellTag}>
`;
}

/**
 * Generates a template for the {@link @microsoft/fast-foundation#DataGridRow} component using
 * the provided prefix.
 *
 * @public
 */
export const dataGridRowTemplate: FoundationElementTemplate<ViewTemplate<DataGridRow>> = (
    context,
    definition
) => {
    const cellItemTemplate: ViewTemplate = createCellItemTemplate(context);
    const headerCellItemTemplate: ViewTemplate = createHeaderCellItemTemplate(context);
    return html<DataGridRow>`
        <template
            role="row"
            class="${x => (x.rowType !== "default" ? x.rowType : "")}"
            :defaultCellItemTemplate="${cellItemTemplate}"
            :defaultHeaderCellItemTemplate="${headerCellItemTemplate}"
            ${children({
                property: "cellElements",
                filter: elements(
                    '[role="cell"],[role="gridcell"],[role="columnheader"],[role="rowheader"]'
                ),
            })}
        >
            <slot ${slotted("slottedCellElements")}></slot>
        </template>
    `;
};
