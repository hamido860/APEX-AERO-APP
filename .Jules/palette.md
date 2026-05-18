## 2024-05-18 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Found multiple icon-only buttons (Edit, Delete, Save, Cancel) in the task database table lacking accessible names. Since they only use the `title` attribute, screen readers might not reliably announce their purpose.
**Action:** Always ensure that icon-only interactive elements explicitly define an `aria-label` (using translation strings where applicable) to guarantee reliable screen reader announcements, complementing any existing visual tooltips or `title` attributes.
