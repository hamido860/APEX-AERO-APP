## 2026-05-19 - FilterDropdown Accessibility\n**Learning:** Found that custom dropdowns (like FilterDropdown) lack basic ARIA attributes linking the button to the dropdown body.\n**Action:** Use `useId()` to generate unique IDs and apply `aria-controls` and `aria-expanded` to custom dropdown toggle buttons.

## 2026-06-09 - Dropdown Keyboard Accessibility
**Learning:** Adding an Escape key handler that restores focus to the toggle button significantly improves the keyboard navigation experience for custom dropdowns, aligning with W3C patterns.
**Action:** Always implement Escape key handlers with focus restoration when creating or updating custom dropdown components.
