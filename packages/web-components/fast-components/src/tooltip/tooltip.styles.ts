import { css, ElementStyles } from "@microsoft/fast-element";
import {
    AnchoredRegion,
    forcedColorsStylesheetBehavior,
    FoundationElementTemplate,
} from "@microsoft/fast-foundation";
import {
    bodyFont,
    controlCornerRadius,
    focusStrokeOuter,
    neutralFillRest,
    neutralForegroundRest,
    strokeWidth,
    typeRampBaseFontSize,
    typeRampBaseLineHeight,
} from "../design-tokens";

/**
 * Styles for Tooltip
 * @public
 */
export const tooltipStyles: FoundationElementTemplate<ElementStyles> = (
    context,
    definition
) =>
    css`
        :host {
            contain: size;
            overflow: visible;
            height: 0;
            width: 0;
        }

        .tooltip {
            box-sizing: border-box;
            border-radius: calc(${controlCornerRadius} * 1px);
            border: calc(${strokeWidth} * 1px) solid ${focusStrokeOuter};
            box-shadow: 0 0 0 1px ${focusStrokeOuter} inset;
            background: ${neutralFillRest};
            color: ${neutralForegroundRest};
            padding: 4px;
            height: fit-content;
            width: fit-content;
            font-family: ${bodyFont};
            font-size: ${typeRampBaseFontSize};
            line-height: ${typeRampBaseLineHeight};
            white-space: nowrap;
            /* TODO: a mechanism to manage z-index across components
                https://github.com/microsoft/fast/issues/3813 */
            z-index: 10000;
        }

        ${context.tagFor(AnchoredRegion)} {
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: visible;
            flex-direction: row;
            pointer-events: none;
        }

        ${context.tagFor(AnchoredRegion)}.right,
        ${context.tagFor(AnchoredRegion)}.left {
            flex-direction: column;
        }

        ${context.tagFor(AnchoredRegion)}.top .tooltip {
            margin-bottom: 4px;
        }

        ${context.tagFor(AnchoredRegion)}.bottom .tooltip {
            margin-top: 4px;
        }

        ${context.tagFor(AnchoredRegion)}.left .tooltip {
            margin-right: 4px;
        }

        ${context.tagFor(AnchoredRegion)}.right .tooltip {
            margin-left: 4px;
        }
    `.withBehaviors(
        forcedColorsStylesheetBehavior(
            css`
                :host([disabled]) {
                    opacity: 1;
                }
            `
        )
    );
