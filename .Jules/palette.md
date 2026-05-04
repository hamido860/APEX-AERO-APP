## 2025-05-04 - [Accessibility] Missing aria-labels on icon-only buttons
**Learning:** Icon-only buttons with SVGs or non-descriptive text were missing aria-label attributes across some components (e.g., TaskDatabasePage, DashboardHeader), causing screen readers to misinterpret their functionality.
**Action:** Consistently apply descriptive aria-labels, utilizing the translation function t() when applicable, to all icon-only interactive elements in future components.
