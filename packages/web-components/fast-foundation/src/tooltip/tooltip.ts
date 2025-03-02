import { attr, DOM, FASTElement, observable } from "@microsoft/fast-element";
import { Direction, keyEscape } from "@microsoft/fast-web-utilities";
import type {
    AnchoredRegion,
    AutoUpdateMode,
    AxisPositioningMode,
    AxisScalingMode,
} from "../anchored-region";
import { getDirection } from "../utilities/";
import { FoundationElement } from "../foundation-element";
import { TooltipPosition } from "./tooltip.options";

export { TooltipPosition };

/**
 * An Tooltip Custom HTML Element.
 *
 * @public
 */
export class Tooltip extends FoundationElement {
    /**
     * Whether the tooltip is visible or not.
     * If undefined tooltip is shown when anchor element is hovered
     *
     * @defaultValue - undefined
     * @public
     * HTML Attribute: visible
     */
    @attr({ mode: "boolean" })
    public visible: boolean;
    private visibleChanged(): void {
        if ((this as FASTElement).$fastController.isConnected) {
            this.updateTooltipVisibility();
            this.updateLayout();
        }
    }

    /**
     * The id of the element the tooltip is anchored to
     *
     * @defaultValue - undefined
     * @public
     * HTML Attribute: anchor
     */
    @attr
    public anchor: string = "";
    private anchorChanged(): void {
        if ((this as FASTElement).$fastController.isConnected) {
            this.anchorElement = this.getAnchor();
        }
    }

    /**
     * The delay in milliseconds before a tooltip is shown after a hover event
     *
     * @defaultValue - 300
     * @public
     * HTML Attribute: delay
     */
    @attr
    public delay: number = 300;

    /**
     * Controls the placement of the tooltip relative to the anchor.
     * When the position is undefined the tooltip is placed above or below the anchor based on available space.
     *
     * @defaultValue - undefined
     * @public
     * HTML Attribute: position
     */
    @attr
    public position: TooltipPosition;
    private positionChanged(): void {
        if ((this as FASTElement).$fastController.isConnected) {
            this.updateLayout();
        }
    }

    /**
     * Controls when the tooltip updates its position, default is 'anchor' which only updates when
     * the anchor is resized.  'auto' will update on scroll/resize events.
     * Corresponds to anchored-region auto-update-mode.
     * @public
     * @remarks
     * HTML Attribute: auto-update-mode
     */
    @attr({ attribute: "auto-update-mode" })
    public autoUpdateMode: AutoUpdateMode = "anchor";

    /**
     * Controls if the tooltip will always remain fully in the viewport on the horizontal axis
     * @public
     * @remarks
     * HTML Attribute: horizontal-viewport-lock
     */
    @attr({ attribute: "horizontal-viewport-lock" })
    public horizontalViewportLock: boolean;

    /**
     * Controls if the tooltip will always remain fully in the viewport on the vertical axis
     * @public
     * @remarks
     * HTML Attribute: vertical-viewport-lock
     */
    @attr({ attribute: "vertical-viewport-lock" })
    public verticalViewportLock: boolean;

    /**
     * the html element currently being used as anchor.
     * Setting this directly overrides the anchor attribute.
     *
     * @public
     */
    @observable
    public anchorElement: HTMLElement | null = null;
    private anchorElementChanged(oldValue: HTMLElement | null): void {
        if ((this as FASTElement).$fastController.isConnected) {
            if (oldValue !== null && oldValue !== undefined) {
                oldValue.removeEventListener("mouseover", this.handleAnchorMouseOver);
                oldValue.removeEventListener("mouseout", this.handleAnchorMouseOut);
                oldValue.removeEventListener("focusin", this.handleAnchorFocusIn);
                oldValue.removeEventListener("focusout", this.handleAnchorFocusOut);
            }

            if (this.anchorElement !== null && this.anchorElement !== undefined) {
                this.anchorElement.addEventListener(
                    "mouseover",
                    this.handleAnchorMouseOver,
                    { passive: true }
                );
                this.anchorElement.addEventListener(
                    "mouseout",
                    this.handleAnchorMouseOut,
                    { passive: true }
                );
                this.anchorElement.addEventListener("focusin", this.handleAnchorFocusIn, {
                    passive: true,
                });
                this.anchorElement.addEventListener(
                    "focusout",
                    this.handleAnchorFocusOut,
                    { passive: true }
                );

                const anchorId: string = this.anchorElement.id;

                if (this.anchorElement.parentElement !== null) {
                    this.anchorElement.parentElement
                        .querySelectorAll(":hover")
                        .forEach(element => {
                            if (element.id === anchorId) {
                                this.startHoverTimer();
                            }
                        });
                }
            }

            if (
                this.region !== null &&
                this.region !== undefined &&
                this.tooltipVisible
            ) {
                this.region.anchorElement = this.anchorElement;
            }

            this.updateLayout();
        }
    }

    /**
     * The current viewport element instance
     *
     * @internal
     */
    @observable
    public viewportElement: HTMLElement | null = null;
    private viewportElementChanged(): void {
        if (this.region !== null && this.region !== undefined) {
            this.region.viewportElement = this.viewportElement;
        }
        this.updateLayout();
    }

    /**
     * @internal
     */
    @observable
    public verticalPositioningMode: AxisPositioningMode = "dynamic";

    /**
     * @internal
     */
    @observable
    public horizontalPositioningMode: AxisPositioningMode = "dynamic";

    /**
     * @internal
     */
    @observable
    public horizontalInset: string = "false";

    /**
     * @internal
     */
    @observable
    public verticalInset: string = "false";

    /**
     * @internal
     */
    @observable
    public horizontalScaling: AxisScalingMode = "content";

    /**
     * @internal
     */
    @observable
    public verticalScaling: AxisScalingMode = "content";

    /**
     * @internal
     */
    @observable
    public verticalDefaultPosition: string | undefined = undefined;

    /**
     * @internal
     */
    @observable
    public horizontalDefaultPosition: string | undefined = undefined;

    /**
     * @internal
     */
    @observable
    public tooltipVisible: boolean = false;

    /**
     * Track current direction to pass to the anchored region
     * updated when tooltip is shown
     *
     * @internal
     */
    @observable
    public currentDirection: Direction = Direction.ltr;

    /**
     * reference to the anchored region
     *
     * @internal
     */
    public region: AnchoredRegion;

    /**
     * The timer that tracks delay time before the tooltip is shown on hover
     */
    private delayTimer: number | null = null;

    /**
     * Indicates whether the anchor is currently being hovered
     */
    private isAnchorHoveredFocused: boolean = false;

    public connectedCallback(): void {
        super.connectedCallback();
        this.anchorElement = this.getAnchor();
        this.updateTooltipVisibility();
    }

    public disconnectedCallback(): void {
        this.hideTooltip();
        this.clearDelayTimer();
        super.disconnectedCallback();
    }

    /**
     * invoked when the anchored region's position relative to the anchor changes
     *
     * @internal
     */
    public handlePositionChange = (ev: Event): void => {
        this.classList.toggle("top", this.region.verticalPosition === "start");
        this.classList.toggle("bottom", this.region.verticalPosition === "end");
        this.classList.toggle("inset-top", this.region.verticalPosition === "insetStart");
        this.classList.toggle(
            "inset-bottom",
            this.region.verticalPosition === "insetEnd"
        );
        this.classList.toggle(
            "center-vertical",
            this.region.verticalPosition === "center"
        );

        this.classList.toggle("left", this.region.horizontalPosition === "start");
        this.classList.toggle("right", this.region.horizontalPosition === "end");
        this.classList.toggle(
            "inset-left",
            this.region.horizontalPosition === "insetStart"
        );
        this.classList.toggle(
            "inset-right",
            this.region.horizontalPosition === "insetEnd"
        );
        this.classList.toggle(
            "center-horizontal",
            this.region.horizontalPosition === "center"
        );
    };

    /**
     * mouse enters anchor
     */
    private handleAnchorMouseOver = (ev: Event): void => {
        this.startHoverTimer();
    };

    /**
     * mouse leaves anchor
     */
    private handleAnchorMouseOut = (ev: Event): void => {
        this.isAnchorHoveredFocused = false;
        this.updateTooltipVisibility();
        this.clearDelayTimer();
    };

    private handleAnchorFocusIn = (ev: Event): void => {
        this.startHoverTimer();
    };

    private handleAnchorFocusOut = (ev: Event): void => {
        this.isAnchorHoveredFocused = false;
        this.updateTooltipVisibility();
        this.clearDelayTimer();
    };

    /**
     * starts the hover timer if not currently running
     */
    private startHoverTimer = (): void => {
        if (this.isAnchorHoveredFocused) {
            return;
        }

        if (this.delay > 1) {
            if (this.delayTimer === null)
                this.delayTimer = window.setTimeout((): void => {
                    this.startHover();
                }, this.delay);
            return;
        }

        this.startHover();
    };

    /**
     * starts the hover delay timer
     */
    private startHover = (): void => {
        this.isAnchorHoveredFocused = true;
        this.updateTooltipVisibility();
    };

    /**
     * clears the hover delay
     */
    private clearDelayTimer = (): void => {
        if (this.delayTimer !== null) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
    };

    /**
     * updated the properties being passed to the anchored region
     */
    private updateLayout(): void {
        switch (this.position) {
            case TooltipPosition.top:
            case TooltipPosition.bottom:
                this.verticalPositioningMode = "locktodefault";
                this.horizontalPositioningMode = "locktodefault";
                this.verticalDefaultPosition = this.position;
                this.horizontalDefaultPosition = "center";
                break;

            case TooltipPosition.right:
            case TooltipPosition.left:
            case TooltipPosition.start:
            case TooltipPosition.end:
                this.verticalPositioningMode = "locktodefault";
                this.horizontalPositioningMode = "locktodefault";
                this.verticalDefaultPosition = "center";
                this.horizontalDefaultPosition = this.position;
                break;

            default:
                this.verticalPositioningMode = "dynamic";
                this.horizontalPositioningMode = "dynamic";
                this.verticalDefaultPosition = void 0;
                this.horizontalDefaultPosition = "center";
                break;
        }
    }

    /**
     *  Gets the anchor element by id
     */
    private getAnchor = (): HTMLElement | null => {
        const rootNode = this.getRootNode();

        if (rootNode instanceof ShadowRoot) {
            return rootNode.getElementById(this.anchor);
        }

        return document.getElementById(this.anchor);
    };

    /**
     * handles key down events to check for dismiss
     */
    private handleDocumentKeydown = (e: KeyboardEvent): void => {
        if (!e.defaultPrevented && this.tooltipVisible) {
            switch (e.key) {
                case keyEscape:
                    this.isAnchorHoveredFocused = false;
                    this.updateTooltipVisibility();
                    this.$emit("dismiss");
                    break;
            }
        }
    };

    /**
     * determines whether to show or hide the tooltip based on current state
     */
    private updateTooltipVisibility = (): void => {
        if (this.visible === false) {
            this.hideTooltip();
        } else if (this.visible === true) {
            this.showTooltip();
            return;
        } else {
            if (this.isAnchorHoveredFocused) {
                this.showTooltip();
                return;
            }
            this.hideTooltip();
        }
    };

    /**
     * shows the tooltip
     */
    private showTooltip = (): void => {
        if (this.tooltipVisible) {
            return;
        }
        this.currentDirection = getDirection(this);
        this.tooltipVisible = true;
        document.addEventListener("keydown", this.handleDocumentKeydown);
        DOM.queueUpdate(this.setRegionProps);
    };

    /**
     * hides the tooltip
     */
    private hideTooltip = (): void => {
        if (!this.tooltipVisible) {
            return;
        }
        if (this.region !== null && this.region !== undefined) {
            (this.region as any).removeEventListener(
                "positionchange",
                this.handlePositionChange
            );
            this.region.viewportElement = null;
            this.region.anchorElement = null;
        }
        document.removeEventListener("keydown", this.handleDocumentKeydown);
        this.tooltipVisible = false;
    };

    /**
     * updates the tooltip anchored region props after it has been
     * added to the DOM
     */
    private setRegionProps = (): void => {
        if (!this.tooltipVisible) {
            return;
        }
        this.region.viewportElement = this.viewportElement;
        this.region.anchorElement = this.anchorElement;
        (this.region as any).addEventListener(
            "positionchange",
            this.handlePositionChange
        );
    };
}
