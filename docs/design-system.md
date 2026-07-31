# Design System (Sprint 2)

`packages/ui` — the web design system, consumed by `apps/web` and
`apps/admin`. See [ui-architecture.md](./ui-architecture.md) for why
`driver-app`/`passenger-app` do **not** import from here.

## Stack

- **Tailwind CSS** for styling — classes only, no CSS-in-JS.
- **Radix UI primitives** (`@radix-ui/react-*`) for anything needing real
  accessibility engineering (focus trapping, roving tabindex, ARIA wiring):
  Dialog, Popover, Tooltip, Tabs, Accordion, Checkbox, RadioGroup, Switch,
  Avatar, Progress, Separator, Select, Toast, Label, Slot. Building these
  from scratch would either take far longer or be less accessible — Radix
  is the standard choice here.
- **class-variance-authority (cva)** for variant props (`variant="primary"`,
  `size="lg"`, …) instead of hand-rolled conditional class strings.
- **`cn()`** (`clsx` + `tailwind-merge`) for merging/overriding classes
  without utility-order bugs.
- **lucide-react** for icons, gated behind a curated registry
  (`tokens/icons.ts`) — see [theme.md](./theme.md).

## The 50 components

| Category | Components |
| --- | --- |
| Buttons | Button, IconButton |
| Form fields | Input, PasswordInput, PhoneInput, OtpInput, Textarea, Checkbox, Radio, Switch, Select, MultiSelect, Combobox, DatePicker, TimePicker |
| Display | Avatar, Badge, Chip, Tag, Card, Typography (Heading/Text), Divider, Breadcrumb |
| Overlays | Dialog, Modal, Drawer, Sheet, Tooltip, Popover, Toast, Snackbar |
| Feedback | Progress, Skeleton, EmptyState, LoadingState, ErrorState, NotificationItem |
| Navigation | TopNavigation, Sidebar, BottomNavigation, FloatingActionButton |
| Data | Tabs, Accordion, Table, Pagination, SearchBar |
| Status | StatusIndicator, OnlineIndicator |
| Preferences | LanguageSelector, ThemeSwitcher |
| Branding | Logo, Illustration |

## Shared bases (avoiding duplication)

Several components that are conceptually similar share one real
implementation instead of three copies of the same logic:

| Shared base | Used by |
| --- | --- |
| `Pill` | Badge, Chip, Tag |
| `SidePanel` (built on Radix Dialog) | Sheet (side-anchored), Drawer (bottom-anchored) |
| `Dialog` | Modal (prop-driven convenience API over the same primitive) |
| `StatusScreen` | EmptyState, LoadingState, ErrorState |
| `StatusIndicator` | OnlineIndicator |
| The toast queue (`ToastProvider`/`useToast`) | Toast, Snackbar (`useSnackbar` is a thin single-line convenience over the same queue) |
| `FieldWrapper` (label/helper/error layout) | Input, PasswordInput, PhoneInput, Textarea, Select, MultiSelect, Combobox, DatePicker, TimePicker, OtpInput |
| `inputVariants` (the visual style) | Every text-entry field above |

## Deliberate simplifications

- **DatePicker / TimePicker** wrap the native `<input type="date">` /
  `<input type="time">` rather than a bespoke calendar/clock widget. This
  ships full keyboard and screen-reader support for free, adapts to the
  user's OS locale automatically, and is a better accessibility outcome
  than a custom widget built under this sprint's timebox.
- **Combobox / MultiSelect** are built on Radix Popover (Radix has no
  native combobox/multiselect primitive) with hand-rolled keyboard
  navigation (arrow keys, Enter, Escape) and proper `role="listbox"`/
  `role="option"` semantics.
- **PhoneInput** shows a static country-code prefix (default `+1`) rather
  than a full country picker — out of scope for a foundation sprint.

## Every component takes its copy as props

Per Part 8 ("no hardcoded text"), no component in this package bakes in a
default English string. Icon-only affordances (`IconButton`, the Dialog
close button, `SearchBar`) take a **required** `label`/`closeLabel` prop
so a missing translation is a compile error, not a silent English string
in a French screen. See [internationalization.md](./internationalization.md).

## Related Docs

- [Theme](./theme.md)
- [UI Architecture](./ui-architecture.md)
- [Responsive](./responsive.md)
- [Internationalization](./internationalization.md)
- [Navigation](./navigation.md)
