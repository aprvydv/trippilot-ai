# Minimal liquid-glass redesign verification

The user requested a simpler Apple-inspired interface, superseding the earlier Ink & Sand mockup. This is a direct revision of the existing app, not a pixel-faithful clone of Apple or the previous generated image.

## Rendered evidence
- Desktop: `docs/images/minimal-desktop.jpg`, native browser viewport 1363 × 936.
- Mobile: `docs/images/minimal-mobile.jpg`, app rendered inside a 390 × 844 iframe; screenshot also includes the surrounding dark QA canvas. This checks CSS responsiveness, not a physical phone.
- Default state: Jaipur, three days, two travellers, budget ₹18,000, preferences collapsed.

## Design changes checked
- System sans-serif typography replaces the decorative serif headings.
- Photo collage, destination shortcut pills, paper textures and repetitive activity captions are removed from the UI.
- Graphite background, restrained blue-white accents, translucent control panel and rounded segmented tabs.
- Narrower centered layout, generous spacing, smaller budget display and quieter supporting text.
- Existing planning, saving, restoration and JSON export actions remain available.
- Mobile fields stack and the primary action spans the form width.

## Functional verification
- Automated suite: 43 tests pass, including API/SQL integration and planner interactions. Budget test now opens preferences before editing.
- Browser: preferences open/close; clearing the budget, collapsing preferences and submitting automatically opens the invalid field and focuses native validation.
- Fixed transient NaN in the collapsed budget summary: invalid/empty values show “Set budget”.
- Console: only extension metadata errors; no app JavaScript error observed.
- API identity and AI settings are unchanged. Authenticated hosted save/restore and live AI were not retested in browser.

No blocking layout issues observed at the checked desktop/mobile sizes. No external paid assets or new dependencies.
