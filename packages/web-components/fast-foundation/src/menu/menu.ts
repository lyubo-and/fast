import { DOM, observable } from "@microsoft/fast-element";
import {
    isHTMLElement,
    keyArrowDown,
    keyArrowUp,
    keyEnd,
    keyHome,
} from "@microsoft/fast-web-utilities";
import {
    MenuItem,
    MenuItemColumnCount,
    MenuItemRole,
    roleForMenuItem,
} from "../menu-item/index";
import { FoundationElement } from "../foundation-element";

/**
 * A Menu Custom HTML Element.
 * Implements the {@link https://www.w3.org/TR/wai-aria-1.1/#menu | ARIA menu }.
 *
 * @public
 */
export class Menu extends FoundationElement {
    /**
     * @internal
     */
    @observable
    public items: HTMLSlotElement;
    private itemsChanged(oldValue, newValue): void {
        // only update children after the component is connected and
        // the setItems has run on connectedCallback
        // (menuItems is undefined until then)
        if (this.$fastController.isConnected && this.menuItems !== undefined) {
            this.setItems();
        }
    }

    private menuItems: Element[] | undefined;

    private expandedItem: MenuItem | null = null;

    /**
     * The index of the focusable element in the items array
     * defaults to -1
     */
    private focusIndex: number = -1;

    private static focusableElementRoles: { [key: string]: string } = roleForMenuItem;

    /**
     * @internal
     */
    public connectedCallback(): void {
        super.connectedCallback();
        DOM.queueUpdate(() => {
            // wait until children have had a chance to
            // connect before setting/checking their props/attributes
            this.setItems();
        });

        this.addEventListener("change", this.changeHandler);
    }

    /**
     * @internal
     */
    public disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeItemListeners();
        this.menuItems = undefined;
        this.removeEventListener("change", this.changeHandler);
    }

    /**
     * @internal
     */
    public readonly isNestedMenu = (): boolean => {
        return (
            this.parentElement !== null &&
            isHTMLElement(this.parentElement) &&
            this.parentElement.getAttribute("role") === "menuitem"
        );
    };

    /**
     * Focuses the first item in the menu.
     *
     * @public
     */
    public focus(): void {
        this.setFocus(0, 1);
    }

    /**
     * Collapses any expanded menu items.
     *
     * @public
     */
    public collapseExpandedItem(): void {
        if (this.expandedItem !== null) {
            this.expandedItem.expanded = false;
            this.expandedItem = null;
        }
    }

    /**
     * @internal
     */
    public handleMenuKeyDown(e: KeyboardEvent): void | boolean {
        if (e.defaultPrevented || this.menuItems === undefined) {
            return;
        }
        switch (e.key) {
            case keyArrowDown:
                // go forward one index
                this.setFocus(this.focusIndex + 1, 1);
                return;
            case keyArrowUp:
                // go back one index
                this.setFocus(this.focusIndex - 1, -1);
                return;
            case keyEnd:
                // set focus on last item
                this.setFocus(this.menuItems.length - 1, -1);
                return;
            case keyHome:
                // set focus on first item
                this.setFocus(0, 1);
                return;

            default:
                // if we are not handling the event, do not prevent default
                return true;
        }
    }

    /**
     * if focus is moving out of the menu, reset to a stable initial state
     * @internal
     */
    public handleFocusOut = (e: FocusEvent) => {
        if (!this.contains(e.relatedTarget as Element) && this.menuItems !== undefined) {
            this.collapseExpandedItem();
            // find our first focusable element
            const focusIndex: number = this.menuItems.findIndex(this.isFocusableElement);
            // set the current focus index's tabindex to -1
            this.menuItems[this.focusIndex].setAttribute("tabindex", "-1");
            // set the first focusable element tabindex to 0
            this.menuItems[focusIndex].setAttribute("tabindex", "0");
            // set the focus index
            this.focusIndex = focusIndex;
        }
    };

    private handleItemFocus = (e: FocusEvent) => {
        const targetItem: HTMLElement = e.target as HTMLElement;

        if (
            this.menuItems !== undefined &&
            targetItem !== this.menuItems[this.focusIndex]
        ) {
            this.menuItems[this.focusIndex].setAttribute("tabindex", "-1");
            this.focusIndex = this.menuItems.indexOf(targetItem);
            targetItem.setAttribute("tabindex", "0");
        }
    };

    private handleExpandedChanged = (e: Event): void => {
        if (
            e.defaultPrevented ||
            e.target === null ||
            this.menuItems === undefined ||
            this.menuItems.indexOf(e.target as Element) < 0
        ) {
            return;
        }

        e.preventDefault();
        const changedItem: MenuItem = (e.target as any) as MenuItem;

        // closing an expanded item without opening another
        if (
            this.expandedItem !== null &&
            changedItem === this.expandedItem &&
            changedItem.expanded === false
        ) {
            this.expandedItem = null;
            return;
        }

        if (changedItem.expanded) {
            if (this.expandedItem !== null && this.expandedItem !== changedItem) {
                this.expandedItem.expanded = false;
            }
            this.menuItems[this.focusIndex].setAttribute("tabindex", "-1");
            this.expandedItem = changedItem;
            this.focusIndex = this.menuItems.indexOf(changedItem);
            changedItem.setAttribute("tabindex", "0");
        }
    };

    private removeItemListeners = (): void => {
        if (this.menuItems !== undefined) {
            this.menuItems.forEach((item: HTMLElement) => {
                item.removeEventListener("expanded-change", this.handleExpandedChanged);
                item.removeEventListener("focus", this.handleItemFocus);
            });
        }
    };

    private setItems = (): void => {
        const newItems: Element[] = this.domChildren();

        this.removeItemListeners();
        this.menuItems = newItems;

        const menuItems = this.menuItems.filter(this.isMenuItemElement);

        // if our focus index is not -1 we have items
        if (menuItems.length) {
            this.focusIndex = 0;
        }

        function elementIndent(el: HTMLElement): MenuItemColumnCount {
            if (!(el instanceof MenuItem)) {
                return 1;
            }
            if (
                el.role !== MenuItemRole.menuitem &&
                el.querySelector("[slot=start]") === null
            ) {
                return 1;
            } else if (
                el.role === MenuItemRole.menuitem &&
                el.querySelector("[slot=start]") !== null
            ) {
                return 1;
            } else if (
                el.role !== MenuItemRole.menuitem &&
                el.querySelector("[slot=start]") !== null
            ) {
                return 2;
            } else {
                return 0;
            }
        }

        const indent: MenuItemColumnCount = menuItems.reduce((accum, current) => {
            const elementValue = elementIndent(current);

            return accum > elementValue ? accum : elementValue;
        }, 0);

        menuItems.forEach((item: HTMLElement, index: number) => {
            item.setAttribute("tabindex", index === 0 ? "0" : "-1");
            item.addEventListener("expanded-change", this.handleExpandedChanged);
            item.addEventListener("focus", this.handleItemFocus);

            if (item instanceof MenuItem) {
                item.startColumnCount = indent;
            }
        });
    };

    /**
     * handle change from child element
     */
    private changeHandler = (e: CustomEvent): void => {
        if (this.menuItems === undefined) {
            return;
        }
        const changedMenuItem: MenuItem = e.target as MenuItem;
        const changeItemIndex: number = this.menuItems.indexOf(changedMenuItem);

        if (changeItemIndex === -1) {
            return;
        }

        if (
            changedMenuItem.role === "menuitemradio" &&
            changedMenuItem.checked === true
        ) {
            for (let i = changeItemIndex - 1; i >= 0; --i) {
                const item: Element = this.menuItems[i];
                const role: string | null = item.getAttribute("role");
                if (role === MenuItemRole.menuitemradio) {
                    (item as MenuItem).checked = false;
                }
                if (role === "separator") {
                    break;
                }
            }
            const maxIndex: number = this.menuItems.length - 1;
            for (let i = changeItemIndex + 1; i <= maxIndex; ++i) {
                const item: Element = this.menuItems[i];
                const role: string | null = item.getAttribute("role");
                if (role === MenuItemRole.menuitemradio) {
                    (item as MenuItem).checked = false;
                }
                if (role === "separator") {
                    break;
                }
            }
        }
    };

    /**
     * get an array of valid DOM children
     */
    private domChildren(): Element[] {
        return Array.from(this.children);
    }

    /**
     * check if the item is a menu item
     */
    private isMenuItemElement = (el: Element): el is HTMLElement => {
        return (
            isHTMLElement(el) &&
            Menu.focusableElementRoles.hasOwnProperty(el.getAttribute("role") as string)
        );
    };

    /**
     * check if the item is focusable
     */
    private isFocusableElement = (el: Element): el is HTMLElement => {
        return this.isMenuItemElement(el);
    };

    private setFocus(focusIndex: number, adjustment: number): void {
        if (this.menuItems === undefined) {
            return;
        }

        while (focusIndex >= 0 && focusIndex < this.menuItems.length) {
            const child: Element = this.menuItems[focusIndex];

            if (this.isFocusableElement(child)) {
                // change the previous index to -1
                if (
                    this.focusIndex > -1 &&
                    this.menuItems.length >= this.focusIndex - 1
                ) {
                    this.menuItems[this.focusIndex].setAttribute("tabindex", "-1");
                }

                // update the focus index
                this.focusIndex = focusIndex;

                // update the tabindex of next focusable element
                child.setAttribute("tabindex", "0");

                // focus the element
                child.focus();

                break;
            }

            focusIndex += adjustment;
        }
    }
}
