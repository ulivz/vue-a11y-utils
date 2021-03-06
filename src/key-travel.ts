import Vue from "vue";
import Component from "vue-class-component";

import { capitalizeFirstLetter } from "./util";

// key travel interface

declare module "vue/types/vue" {
  interface Vue {
    autofocus?: boolean;
    orientation?: string;
    [keyMethod: string]: any;
  }
}

interface KeyConfig {
  [key: string]: string;
}

const defaultKeyToMethod: KeyConfig = {
  ArrowUp: "prev",
  ArrowDown: "next",
  ArrowLeft: "prev",
  ArrowRight: "next",
  Home: "first",
  End: "last",
  Enter: "action",
  Space: "action"
};

/**
 * Mixin: KeyTravel
 * - methods: keyTravel(event[, config])
 * work with:
 * - value: autofocus, orientation
 * - methods: getKeyItems()
 * could be overrided:
 * - methods: // call focus() or $el.focus() by default
 *            goPrev(), goNext(), goFirst(), goLast(),
 *            // focus first item in key items by default
 *            getAutofocusItem(),
 *            // nothing happen by default
 *            goNextPage(), goPrevPage(),
 *            // call fireAction(item) by default
 *            goAction()
 *            // call fireAction() in the item by default
 *            fireAction(item)
 */
@Component({
  // fixed
  mounted(): void {
    if (this.autofocus) {
      focusItem(this.getAutofocusItem());
    }
  }
})
export default class MixinKeyTravel extends Vue {
  // fixed
  keyTravel(event: KeyboardEvent, config?: KeyConfig): void {
    // get the current key
    const keyToMethod: KeyConfig = Object.assign(
      {},
      defaultKeyToMethod,
      this.orientation === "vertical"
        ? {
            ArrowLeft: "",
            ArrowRight: ""
          }
        : {},
      this.orientation === "horizontal"
        ? {
            ArrowUp: "",
            ArrowDown: ""
          }
        : {},
      config
    );
    const methodName: string = keyToMethod[event.key] || "";

    // make sure what to do next
    if (methodName) {
      const method = this[`go${capitalizeFirstLetter(methodName)}`];
      if (typeof method === "function") {
        const willPreventDefault = method.call(this, event);
        if (willPreventDefault) {
          event.preventDefault();
        }
      }
    }
  }
  // need be overrided
  getKeyItems(): Array<Vue> {
    return [];
  }
  // could be overrided
  fireAction(item: Vue): void {
    fireItemAction(item);
  }
  // could be overrided
  getAutofocusItem(): Vue {
    return this.getKeyItems()[0];
  }
  // could be overrided
  goPrev() {
    const items = this.getKeyItems();
    const length = items.length;
    if (length === 0) {
      return;
    }
    const activeIndex = getActiveIndex(items);
    const prevItem =
      activeIndex <= 0 ? items[length - 1] : items[activeIndex - 1];
    return focusItem(prevItem);
  }
  // could be overrided
  goNext() {
    const items = this.getKeyItems();
    const length = items.length;
    if (length === 0) {
      return;
    }
    const activeIndex = getActiveIndex(items);
    const nextItem =
      activeIndex === length - 1 ? items[0] : items[activeIndex + 1];
    return focusItem(nextItem);
  }
  // could be overrided
  goFirst() {
    const items = this.getKeyItems();
    const length = items.length;
    if (length === 0) {
      return;
    }
    const firstItem = items[0];
    if (!isActiveItem(firstItem)) {
      return focusItem(firstItem);
    }
  }
  // could be overrided
  goLast() {
    const items = this.getKeyItems();
    const length = items.length;
    if (length === 0) {
      return;
    }
    const lastItem = items[length - 1];
    if (!isActiveItem(lastItem)) {
      return focusItem(lastItem);
    }
  }
  // could be overrided
  goNextPage() {}
  // could be overrided
  goPrevPage() {}
  // could be overrided
  goAction() {
    const items = this.getKeyItems();
    const length = items.length;
    if (length === 0) {
      return;
    }
    const activeIndex = getActiveIndex(items);
    const activeItem = items[activeIndex];
    return this.fireAction(activeItem);
  }
}

// focus functions

function getActiveIndex(items: Array<Vue>): number {
  let activeIndex = -1;
  const activeElement = document.activeElement;
  items.some((item: Vue, index: number) => {
    const el = item.$el ? item.$el : item;
    if (el === activeElement) {
      activeIndex = index;
      return true;
    }
    return false;
  });
  return activeIndex;
}

function isActiveItem(item: Vue): boolean {
  if (!item) {
    return false;
  }
  const el = item.$el ? item.$el : item;
  return el === document.activeElement;
}

function focusItem(item: Vue): any {
  if (item) {
    if (typeof item.focus === "function") {
      item.focus();
      return true;
    }
    if (item.$el && typeof item.$el.focus === "function") {
      item.$el.focus();
      return true;
    }
  }
}

function fireItemAction(item: Vue): any {
  if (item && typeof item.fireAction === "function") {
    item.fireAction();
    return true;
  }
}
