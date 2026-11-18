# Dayflow UI redesign contract

Authority: expand the lavender editorial mobile identity pinned in prompt.md. The user approved a more expressive redesign, then requested UI Taste, Design Taste and Impeccable explicitly. Baseline before this pass is Git commit `4c9d550`.

Target: `dayflow-ui-target.png`, generated with the built-in image tool, actual dimensions 887×1774. Six illustrative artboards form a 3×2 contact sheet. Each nominal artboard is about 296×887; implementation adapts its proportions to 390×844 and 320×740 with native scrolling and safe areas. This is a spatial design reference, not proof of pixel-perfect native fidelity.

The design-taste app sheet is Editorial greeting, seed 1565600276. Adopt its personal greeting, tonal grouping, coherent hierarchy and real-data discipline. The user's explicit lavender, selective gradients, native bottom tabs and mobile composition override the sheet's desktop sidebar, chart palette and four-tile defaults.

Signature: the Dayflow horizon — quiet curved layers derived from the sunrise brand mark — alongside a connected time rail. Use it in the canvas header, progress feature and full-screen Focus atmosphere; do not put an ornament on every field.

| Screen   | First question                  | Composition                                                                                          |
| -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Today    | What deserves time today?       | Personal header, light lavender progress feature, date strip, connected timeline, primary add action |
| Tasks    | What should I work on?          | Active/completed summary, search and status filters, readable task rows with real subtask progress   |
| Calendar | When will I do it?              | Month title, view selector, compact calendar, duration-aware agenda with distinct deadlines          |
| Focus    | What has my attention now?      | Edge-to-edge indigo, large double ring, one current task, clear pause/end controls                   |
| Insights | What progress did I make?       | Two real summary values, readable daily bars, planned/completed comparison, category bars            |
| Settings | How do I make this work for me? | Profile identity, grouped appearance/reminder/preferences navigation, focused edit screens           |

Plus Jakarta Sans remains the only font. Body contrast should reach 4.5:1; interactive targets at least 44px. No fabricated counts, placeholder people in live screens, unimplemented calendar/help controls, AI, payments or collaboration. The generated chart and sample figures are illustrative only; implementation uses task completion data returned by the API.

Verify browser preview independently from native-device checks. Inspect the six actual screens at representative phone widths, exercise primary actions, then run typecheck, form/date tests and relevant exports. Do not claim physical-device verification without a device run.
