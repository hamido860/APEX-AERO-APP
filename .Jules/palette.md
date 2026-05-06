## 2023-10-27 - [FilterDropdown Accessibility]
**Learning:** Custom dropdown components lacking native `<select>` structural implications must explicitly manage state and linkage using ARIA attributes like `aria-expanded` and `aria-controls` to be compatible with screen readers.
**Action:** When implementing or modifying custom dropdowns, always use React's `useId()` to generate a unique ID, apply `aria-expanded` and `aria-haspopup` to the trigger button, and link it to the content wrapper via `aria-controls` while giving the wrapper the correct role (e.g., `role="listbox"`).
