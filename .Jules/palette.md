
## 2024-05-14 - Custom Dropdown Accessibility
**Learning:** In this project's architecture, custom dropdown components frequently miss crucial ARIA attributes that connect the toggle button to the dropdown body, which hinders screen reader users.
**Action:** Always utilize React's `useId()` to generate a unique ID for the dropdown body, and assign it to the toggle button via `aria-controls`. Also, ensure `aria-expanded` is accurately tracking the dropdown's open/close state.
