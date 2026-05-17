## 2024-05-17 - Accessible Custom Dropdowns

**Learning:** Custom dropdown components like `FilterDropdown` lack native screen reader support. While adding `aria-expanded` and `aria-controls` helps users understand the open/close state, we must avoid adding `aria-haspopup` unless the child items have explicit, matching roles (like `role="menu"` with `role="menuitem"` children or `role="listbox"` with `role="option"` children).

**Action:** When implementing custom interactive elements, always consider screen reader state announcements (`aria-expanded`, `aria-selected`, etc.) and establish clear relationships (`aria-controls`, `aria-describedby`) using `useId()` for uniqueness.
