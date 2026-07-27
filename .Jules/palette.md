## 2024-07-09 - Added Keyboard Navigation to FilterDropdown
**Learning:** `pnpm format` formats the entire repository, leading to massive unintended diffs that make code reviews difficult and cause merge conflicts. When aiming to make micro-UX improvements under 50 lines, avoid running full repository formatters. Also, `aria-expanded`, `aria-controls`, and `aria-label` are critical for custom dropdown menus, along with an `Escape` key listener to close the dropdown and return focus to the trigger button for better accessibility.
**Action:** Do not run repository-wide formatting commands blindly when making isolated changes. Always ensure only the intended files/lines are modified and committed.

## 2024-07-27 - Icon-Only Button Accessibility and Tooltips
**Learning:** Icon-only buttons (using SVGs) often lack programmatic names (for screen readers) and visible tooltips (for sighted users hovering with a mouse). They also sometimes lack focus indicators, breaking keyboard accessibility. We must ensure every such button has `aria-label`, `title`, and `focus-visible` classes.
**Action:** When adding or reviewing icon-only interactive elements, systematically verify the presence of `aria-label` (accessibility tree), `title` (native tooltip), and explicit Tailwind focus styles (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500`).
