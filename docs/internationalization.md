# Internationalization (Sprint 2)

## Why a custom provider instead of next-intl/i18next

Both languages required by Part 8 (English, French) needed to work
identically across two Next.js apps and two Expo apps with **one** shared
implementation. Framework-specific i18n libraries (`next-intl`) require
restructuring Next.js routing around a `[locale]` dynamic segment — a real
architecture change to every route this sprint already built, and one
`react-intl`/`next-intl` can't share with React Native anyway. A small,
dependency-free context + dictionary-lookup provider
(`packages/hooks/src/i18n`) works identically in both:

```ts
const { locale, setLocale, t } = useTranslation();
t("auth.loginTitle");
t("common.pageOf", { current: 2, total: 5 }); // {current}/{total} interpolation
```

## Structure

- `translations.types.ts` — `Locale = "en" | "fr"`, `LOCALES`,
  `DEFAULT_LOCALE`, `LOCALE_LABELS`.
- `locales/en.ts` — the canonical dictionary, grouped by area: `common`,
  `nav`, `footer`, `auth`, `settings`, `profile`, `becomeDriver`,
  `website.*` (one key per marketing page), `admin.*` (sidebar/header/
  login/dashboard/placeholder cards), `emptyState`, `errorState`.
- `locales/fr.ts` — declared `satisfies typeof en`, so TypeScript fails
  the build the moment a key exists in one dictionary and not the other.
  This is the actual enforcement mechanism for "every language stays
  complete," not a manual checklist.
- `I18nProvider.tsx` — the context, dot-path key resolution
  (`resolveKey`), `{param}` interpolation, and the same
  storage-adapter-injection pattern as `ThemeProvider` (see
  [theme.md](./theme.md)) for persisting the chosen locale.

## No hardcoded text

Part 8 is enforced two ways:

1. **App code** — every screen/page built this sprint calls `t("...")`
   for visible copy; none hardcodes an English string. Search
   `apps/*/src` for a plain string literal inside JSX text content and
   you should find translation keys, not prose.
2. **`packages/ui` components** — never bake in default copy. Anything
   needing a label takes it as a **required** prop (`IconButton`'s
   `label`, `Dialog`'s `closeLabel`, `SearchBar`'s `label`,
   `PasswordInput`'s `showPasswordLabel`/`hidePasswordLabel`) so a missing
   translation is a TypeScript error at the call site, not a silently
   English string shipped inside a French screen.

The one deliberate exception: native `<input type="date">`/`<input
type="time">` (`DatePicker`/`TimePicker`) render browser-native picker
chrome that isn't reachable from JavaScript at all — the OS/browser
localizes that UI itself based on the user's system locale, independent of
this app's `t()` calls.

## Adding a new locale

1. Add the code to `LOCALES`/`LOCALE_LABELS` in `translations.types.ts`.
2. Create `locales/<code>.ts` with `satisfies typeof en` — TypeScript will
   list every missing key.
3. Register it in `I18nProvider.tsx`'s `DICTIONARIES` map.

## Web vs. native wiring

Identical hook, different persistence adapter — see
[ui-architecture.md](./ui-architecture.md) for the full provider-injection
pattern:

- Web: `RideI18nProvider` (`packages/ui`) backs `storage` with
  `localStorage`.
- Native: each app's `_layout.tsx` backs `storage` with `AsyncStorage`
  directly.

## Known limitation

The root `<html lang="en">` in both Next.js apps is static — since locale
switching is a client-side runtime choice (not a URL segment), the `lang`
attribute doesn't currently update when a user switches to French mid-
session. Fixing this properly means either the `next-intl`-style routing
restructure described above, or a client-side effect that patches
`document.documentElement.lang` on locale change — either is a reasonable
next step, deliberately left out of this sprint's scope.

## Related Docs

- [Design System](./design-system.md)
- [UI Architecture](./ui-architecture.md)
