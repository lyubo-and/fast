import { STORY_RENDERED } from "@storybook/core-events";
import addons from "@storybook/addons";
import type { Tooltip as FoundationTooltip } from "@microsoft/fast-foundation";
import TooltipTemplate from "./fixtures/base.html";
import "../button";
import "./index";

function onShowClick(): void {
    for (let i = 1; i <= 4; i++) {
        const tooltipInstance = document.getElementById(
            `tooltip-show-${i}`
        ) as FoundationTooltip;
        tooltipInstance.visible = !tooltipInstance.visible;
    }
}

//check changing anchor by changing anchorElement
function onAnchorMouseEnterProp(e: MouseEvent): void {
    if (!e.target) {
        return;
    }

    const tooltipInstance = document.getElementById(
        "tooltip-anchor-switch"
    ) as FoundationTooltip;
    tooltipInstance.anchorElement = e.target as HTMLElement;
}

//check changing anchor by setting attribute
function onAnchorMouseEnterAttribute(e: MouseEvent): void {
    if (!e.target) {
        return;
    }

    const tooltipInstance = document.getElementById(
        "tooltip-anchor-switch"
    ) as FoundationTooltip;
    tooltipInstance.setAttribute("anchor", (e.target as HTMLElement).id);
}

addons.getChannel().addListener(STORY_RENDERED, (name: string) => {
    if (name.toLowerCase().startsWith("tooltip")) {
        document
            .querySelectorAll("fast-button[id^=anchor-anchor-switch-prop]")
            .forEach((el: HTMLElement) => {
                el.addEventListener("mouseenter", onAnchorMouseEnterProp);
            });

        document
            .querySelectorAll("fast-button[id^=anchor-anchor-switch-attribute]")
            .forEach((el: HTMLElement) => {
                el.addEventListener("mouseenter", onAnchorMouseEnterAttribute);
            });

        const showButton = document.getElementById("anchor-show") as HTMLElement;
        showButton.addEventListener("click", onShowClick);
    }
});

export default {
    title: "Tooltip",
};

export const Tooltip = () => TooltipTemplate;
