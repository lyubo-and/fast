import { css, ElementStyles } from "@microsoft/fast-element";
import {
    AccordionItemOptions,
    display,
    focusVisible,
    forcedColorsStylesheetBehavior,
    FoundationElementTemplate,
} from "@microsoft/fast-foundation";
import { SystemColors } from "@microsoft/fast-web-utilities";
import {
    accentFillRest,
    bodyFont,
    controlCornerRadius,
    density,
    designUnit,
    focusStrokeOuter,
    focusStrokeWidth,
    neutralForegroundRest,
    neutralStrokeDividerRest,
    strokeWidth,
    typeRampMinus1FontSize,
    typeRampMinus1LineHeight,
} from "../design-tokens";
import { heightNumber } from "../styles/size";

/**
 * Styles for AccordionItem
 * @public
 */
export const accordionItemStyles: FoundationElementTemplate<
    ElementStyles,
    AccordionItemOptions
> = (context, definition) =>
    css`
    ${display("flex")} :host {
        box-sizing: border-box;
        font-family: ${bodyFont};
        flex-direction: column;
        font-size: ${typeRampMinus1FontSize};
        line-height: ${typeRampMinus1LineHeight};
        border-bottom: calc(${strokeWidth} * 1px) solid ${neutralStrokeDividerRest};
    }

    .region {
        display: none;
        padding: calc((6 + (${designUnit} * 2 * ${density})) * 1px);
    }

    .heading {
        display: grid;
        position: relative;
        grid-template-columns: auto 1fr auto calc(${heightNumber} * 1px);
    }

    .button {
        appearance: none;
        border: none;
        background: none;
        grid-column: 2;
        grid-row: 1;
        outline: none;
        padding: 0 calc((6 + (${designUnit} * 2 * ${density})) * 1px);
        text-align: left;
        height: calc(${heightNumber} * 1px);
        color: ${neutralForegroundRest};
        cursor: pointer;
        font-family: inherit;
    }

    .button:hover {
        color: ${neutralForegroundRest};
    }

    .button:active {
        color: ${neutralForegroundRest};
    }

    .button::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        cursor: pointer;
    }

    .button:${focusVisible}::before {
        outline: none;
        border: calc(${focusStrokeWidth} * 1px) solid ${focusStrokeOuter};
        border-radius: calc(${controlCornerRadius} * 1px);
    }

    :host([expanded]) .region {
        display: block;
    }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        grid-column: 4;
        pointer-events: none;
        position: relative;
    }

    slot[name="expanded-icon"],
    slot[name="collapsed-icon"] {
        fill: ${accentFillRest};
    }

    slot[name="collapsed-icon"] {
        display: flex;
    }

    :host([expanded]) slot[name="collapsed-icon"] {
        display: none;
    }

    slot[name="expanded-icon"] {
        display: none;
    }

    :host([expanded]) slot[name="expanded-icon"] {
        display: flex;
    }

    .start {
        display: flex;
        align-items: center;
        padding-inline-start: calc(${designUnit} * 1px);
        justify-content: center;
        grid-column: 1;
        position: relative;
    }

    .end {
        display: flex;
        align-items: center;
        justify-content: center;
        grid-column: 3;
        position: relative;
    }
`.withBehaviors(
        forcedColorsStylesheetBehavior(
            css`
            .button:${focusVisible}::before {
                border-color: ${SystemColors.Highlight};
            }
            :host slot[name="collapsed-icon"],
            :host([expanded]) slot[name="expanded-icon"] {
                fill: ${SystemColors.ButtonText};
            }
        `
        )
    );
