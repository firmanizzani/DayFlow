# Floating navigation

Mode: Operate. Follow the supplied rounded floating navigation reference within
Dayflow's existing visual system. Impeccable guides spacing, interaction targets,
safe areas, hierarchy and theme consistency; no new visual identity is introduced.

The bar retains Today, Tasks, Calendar and Insights. The central 56px Focus action
opens the existing Focus stack route instead of introducing a fifth tab. The
active tab retains normal tab events, long press and screen-reader selection.
Use the installed Expo Router SDK 58 JS tabs API (`emitter` and `navigateToTab`).

The pill is 72px tall, up to 560px wide, with 16px minimum side gutters and a bottom
gap of max(safe-area inset, 12px) + 8px. At 320px width each tab has a 55x60px touch
target. The bar occupies normal layout space, so page content cannot sit behind
it. Keyboard show/hide events hide and restore it on native. All functional
Pressable styles bypass NativeWind interop, preserving native layout and feedback.

Use the matching surface/background in light and dark themes, a soft floating
shadow, and a darker lavender selected color on light for 5.51:1 text contrast.
There is no full-width bottom attachment or divider.

Browser review covered light/dark appearances, 390x844 and 320x740 widths, all
four tab destinations and the Focus action/back path. The 320px check measured
55x60px tabs, a 56px Focus target, 20px bottom gap (browser safe area is zero),
and no horizontal page overflow. QA-account theme was restored after review.
TypeScript, 8 mobile tests and iOS/Android/web exports pass. Device safe areas and
keyboard appearance still need an Expo Go/device check; browser checks do not
establish native device fidelity.

My tasks places its 56px rounded-square Add task action (18px corners) at the lower right of the
content area, above the navbar, instead of in the header. The list reserves 112px
of bottom padding so its final row can scroll clear of the action. The action
hides while the native keyboard is open. Browser review verified its size,
position at the end of the list, and task-form navigation without creating data.
