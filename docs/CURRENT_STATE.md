# Current State

Analysis date: 2026-04-28.

## Summary

`myApp` is an Ionic Angular standalone application packaged with Capacitor for Android. The application is a local photo gallery with three bottom-tab pages:

- `Guia`: static onboarding/help content for the photo gallery.
- `Fotos`: the primary feature page for taking, viewing, editing, deleting, and sharing photos.
- `Envio`: static explanatory content about sharing photos.

The main runtime feature is implemented by `src/app/services/photo.service.ts`, which uses Capacitor plugins for camera access, filesystem storage, preferences, status bar styling, and sharing. The Android project is present under `android/` and is configured for Capacitor with app id `com.example.app`.

## Detected Stack

- Primary stack: Capacitor.
- UI stack: Ionic Angular with standalone Angular components.
- Framework versions from `package.json`:
  - Angular `^20.0.0`
  - Ionic Angular `^8.8.4`
  - Capacitor core/Android `8.3.0` / `^8.3.0`
  - RxJS `~7.8.0`
  - TypeScript `~5.9.0`
- Native target: Android.
  - `minSdkVersion`: 24
  - `compileSdkVersion`: 36
  - `targetSdkVersion`: 36
- Package manager: npm, with `package-lock.json` present.

## Project Structure

- `src/main.ts`: bootstraps the standalone Angular app, configures Ionic in Material Design mode, and enables router preloading.
- `src/app/app.component.ts`: root Ionic shell and Capacitor status bar setup.
- `src/app/app.routes.ts`: root route that lazy-loads the tabs route tree.
- `src/app/tabs/`: bottom tab shell and tab routes.
- `src/app/tab1/`: guide/onboarding content.
- `src/app/tab2/`: photo gallery UI and user actions.
- `src/app/tab3/`: sharing information content.
- `src/app/services/photo.service.ts`: photo capture, persistence, deletion, editing, loading, and sharing logic.
- `src/assets/icon/`: local PNG assets used by guide and sending pages.
- `src/global.scss` and `src/theme/variables.scss`: Ionic global imports and app theme variables.
- `android/`: generated Capacitor Android project, Gradle configuration, native resources, copied web assets, and Capacitor plugin metadata.
- `docs/`: project documentation maintained for Codex analysis.
- `prompts/`: project-specific prompt assets.

## Current Behavior

- App startup:
  - `bootstrapApplication()` loads `AppComponent`.
  - Ionic route reuse strategy is configured.
  - Routes are preloaded with `PreloadAllModules`.
  - Ionic mode is forced to `md`.
- Navigation:
  - The root path loads `tabs.routes`.
  - `/tabs/tab1`, `/tabs/tab2`, and `/tabs/tab3` are lazy-loaded standalone page components.
  - Empty paths redirect to `/tabs/tab1`.
- Photo flow:
  - `Tab2Page.ngOnInit()` calls `PhotoService.loadSaved()`.
  - The floating action button calls `PhotoService.addNewToGallery()`.
  - Captured images are stored through Capacitor Filesystem in `Directory.Library`.
  - Photo metadata is stored in Capacitor Preferences under the key `photos`.
  - Gallery state is held in an Angular signal: `PhotoService.photos`.
  - The gallery page displays thumbnails from `webviewPath`.
  - Clicking a photo opens an Ionic modal with actions for share, delete, edit, and information.
- Android:
  - The Android manifest declares `INTERNET` permission and a `FileProvider`.
  - Capacitor plugin metadata lists action sheet, app, camera, filesystem, haptics, keyboard, preferences, share, splash screen, and status bar plugins.

## Validation

The configured lint command was run:

```bash
npm run lint
```

Current result: failed.

Findings:

- `src/app/services/photo.service.ts:43`: `@angular-eslint/prefer-inject` reports constructor injection should use `inject()`.
- `src/app/tab2/tab2.page.ts:104`: `@angular-eslint/prefer-inject` reports constructor injection should use `inject()`.
- `src/app/tab2/tab2.page.ts:108`: `@angular-eslint/use-lifecycle-interface` warns that `OnInit` should be implemented when `ngOnInit` exists.

No application source code was changed during this analysis.

## Known Problems

- `Tab2Page.sharePhoto()` calls itself recursively:
  - `src/app/tab2/tab2.page.ts` defines `sharePhoto(){ this.sharePhoto(); }`.
  - The modal share button and action sheet share handler call this method, so using share can cause infinite recursion instead of invoking `PhotoService.sharePhoto()`.
- The action sheet state appears unused for opening:
  - `isActionSheetOpen` is initialized and an `<ion-action-sheet>` exists, but `showActionSheet()` opens the modal rather than setting `isActionSheetOpen` to true.
- The project currently fails lint due to existing Angular ESLint violations.
- `PhotoService.addNewToGallery()` requests `Camera.takePhoto()` with `saveToGallery: true`, but the Android manifest only explicitly declares `INTERNET`. Camera/gallery permissions may depend on Capacitor's generated/plugin behavior and Android version behavior.
- `Camera.takePhoto()` is called without an explicit `resultType` or `source`, while the service later expects URI/web path fields. This should be verified against the Capacitor Camera API version in use.
- `Camera.editURIPhoto()` is used and the app depends on the returned URI path being editable and readable across platforms. That behavior should be tested on actual Android devices.
- `PhotoService.deletePhoto()` persists metadata before file deletion. If file deletion fails on hybrid platforms, preferences may already point to a removed list item while the file remains.
- `showPhotoInfo()` uses the browser `alert()` API rather than Ionic UI components, which gives a less native mobile experience.
- Several generated or build-related Android artifacts are present in the working tree listing, including `.gradle`, `.idea`, build reports, and copied web assets under `android/app/src/main/assets/public`. Some are covered by ignore rules, but their presence should be reviewed before committing.

## Risks

- Native behavior risk: Camera, filesystem, edit, and share flows rely on device capabilities and URI handling that cannot be fully validated by browser-only tests.
- Data consistency risk: Photo metadata is stored separately from photo files, so failures during write/delete/edit can leave stale metadata or orphan files.
- Platform divergence risk: Hybrid and web branches in `PhotoService` use different file paths and `webviewPath` construction.
- Test coverage risk: Current specs mostly assert component/service creation and do not cover capture, persistence, deletion, edit, or share behavior.
- Build artifact risk: Android generated files and copied web assets can create noisy diffs if not consistently ignored and regenerated.
- Configuration risk: `appId` and Android namespace are still `com.example.app`, which is suitable for a template but not for a production app identity.

## Improvement Opportunities

- Fix the recursive share method in `Tab2Page` so it delegates to `PhotoService.sharePhoto()` with the selected photo.
- Resolve current lint findings by following the configured Angular ESLint rules or adjusting the rules intentionally.
- Add focused tests for `PhotoService` using mocked Capacitor plugins:
  - load saved photo metadata
  - add a captured photo
  - delete a photo
  - edit a photo
  - share a selected photo
- Add UI tests for `Tab2Page` selection, modal actions, empty state, and delete confirmation.
- Make camera options explicit, including `resultType`, `source`, and metadata expectations.
- Review Android permissions and provider paths for Android 13+ media access and sharing behavior.
- Replace browser alerts with Ionic modal/alert presentation for photo metadata.
- Add error handling around camera cancellation, filesystem failures, preference writes, edit failures, and share failures.
- Consider using a small persistence abstraction if more media types or metadata fields are added.
- Confirm which Android generated files should be committed and clean up tracked/generated output policy without deleting project files during analysis.
