# Authentication and startup

Mode: Operate. Scope: sign-in, registration, entry routing and splash.
Keep Dayflow's existing Plus Jakarta Sans, lavender palette, native controls and
light/dark theme. The supplied reference informs hierarchy and form details;
it is not a screen to reproduce verbatim.

The user chose a Dayflow logo and fine flow lines after reviewing the initial
3D illustration treatment. Authentication uses no 3D imagery. Onboarding keeps
its existing approved illustrations. The brand stays centered, with a quiet
geometric flow motif above a left-aligned heading and labeled native fields.
One primary action leads each form; the alternate auth flow is a text link.

Auth fields have contextual icons, visible focus/error borders, independent
password visibility controls, keyboard Next/Go behavior and autofill metadata.
Registration displays actual password-requirement and confirmation feedback.
Existing email/password API behavior, validation, session storage, loading and
recoverable errors remain in place. OAuth and legal-consent controls from the
reference are not introduced because those services/content are not configured.

Entry flow: signed-out launch opens Login. Create an account opens registration.
The user requested removal of Explore Dayflow from Login. The existing onboarding
route remains; Skip and Get started return to Login. Signed-in sessions continue
to Today.

Native launch uses expo-splash-screen with matching light/dark background and
logo assets. The React startup layer runs a logo rise/scale, wordmark reveal and
horizon-line reveal, followed by a fade into the app. Total authored motion is
approximately 2.08 seconds; startup waits longer if local fonts/session hydration
are not ready. Reduced motion skips the authored animation. No remote request
is required to finish the splash. Native splash configuration changes require a
new native build; Expo Go cannot fully validate the OS launch screen.

Skills: Impeccable (project-context fallback because its launcher could not
initialize its cache), design-taste-frontend (editorial-greeting, seed 1670234385).
Pinned Dayflow palette/type take precedence over the skill's generic palette.
The reference and user-selected masthead take precedence over unrelated dashboard
shell patterns. No placeholder application data or unsupported social actions.

Verification uses browser previews for responsive UI; these are not a claim of
physical Android/iPhone validation. TypeScript, mobile tests and platform bundle
exports are checked separately. Existing native brand assets are generated from
the vector brand source by scripts/generate-brand.mjs; no stock assets are used.
The same script generates the 64px Dayflow favicon configured through
expo.web.favicon. Web export includes its favicon.ico and HTML icon link.

Final checks: TypeScript and all 6 mobile tests pass; Android, iOS and web exports
complete successfully. Source taste lint reports 0 FAIL / 0 WARN. Browser review
covered 320x740 and 390x844 in dark mode, empty-form errors, mismatched/matching
passwords, independent visibility toggles, tour entry/Skip, forgot-password
navigation and the default signed-out Login route. Dark startup appearance was
observed during launch. Light appearance is configured but was not visually
checked in this browser session. Native OS splash and keyboard behavior still
need device validation. The separate production-preview server was unreachable
from the browser, so visual captures use Metro; no rendered inspector pass is
claimed. Final captures remain private in .local/auth-*-final.jpg.
