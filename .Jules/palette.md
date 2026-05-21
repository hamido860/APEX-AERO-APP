## 2024-05-18 - Improve Custom Dropdown Accessibility
**Learning:** Custom dropdown components like `FilterDropdown` lacked basic screen reader and keyboard accessibility support (missing `aria-expanded`, `aria-controls`, and Escape key handler), which is a common pattern for interactive popovers that should be established.
**Action:** Always link dropdown buttons to their menus using `aria-controls` with `useId()`, update `aria-expanded` state dynamically, and implement Escape key handlers to close the menu for keyboard users.
