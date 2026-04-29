# Current State

## Summary

This repository path is the Android `app` module for an Ionic/Angular Capacitor application. The native Android layer is intentionally thin: `MainActivity` extends Capacitor's `BridgeActivity`, and most application behavior lives in the adjacent web app under `../../src`.

The user-facing app is a Portuguese photo gallery named "My Camera". It has a tabbed Ionic UI with a guide tab, a photo gallery tab, and a sharing/instructions tab. The main feature is implemented by `../../src/app/services/photo.service.ts`, which uses Capacitor Camera, Filesystem, Preferences, Share, and Status Bar plugins.

## Detected Stack

- Primary native stack: Android application module.
- Hybrid shell: Capacitor Android.
- Web stack packaged by Capacitor: Ionic Angular standalone components.
- Package manager: npm, with `../../package-lock.json` present.
- Build systems:
  - Android Gradle project under `../`.
  - Angular CLI project at `../../`.

## Project Structure

- `build.gradle`: Android app module configuration.
- `capacitor.build.gradle`: generated Capacitor dependency wiring for Android plugins.
- `proguard-rules.pro`: release shrinker/ProGuard rules, including a keep rule for Capacitor classes.
- `src/main/AndroidManifest.xml`: Android app manifest, launcher activity, file provider, and permissions.
- `src/main/java/com/example/app/MainActivity.java`: Capacitor bridge activity.
- `src/main/res/`: Android resources for strings, styles, launcher icons, splash assets, file provider paths, and Capacitor XML config.
- `src/test/` and `src/androidTest/`: scaffold unit and instrumented tests.
- `docs/`: local project documentation for this analysis.
- `prompts/`: reusable project prompts.
- Adjacent project root files:
  - `../../package.json`: npm scripts and Angular/Ionic/Capacitor dependencies.
  - `../../capacitor.config.ts`: Capacitor app id, app name, and web output directory.
  - `../../angular.json`: Angular build, serve, test, and lint configuration.
  - `../../src/app/`: Ionic/Angular application source.

## Main Dependencies

Android and native dependencies:

- Android Gradle Plugin `9.1.1`.
- Google Services Gradle plugin `4.4.4`, applied only when `google-services.json` exists.
- Capacitor Android project `:capacitor-android`.
- Capacitor plugin projects for action sheet, app, camera, filesystem, haptics, keyboard, preferences, share, splash screen, and status bar.
- AndroidX AppCompat, CoordinatorLayout, Core SplashScreen.
- JUnit, AndroidX JUnit, and Espresso for tests.

Web app dependencies from `../../package.json`:

- Angular `^20.0.0`.
- Ionic Angular `^8.8.4`.
- Capacitor Core and Android `8.3.0`.
- Capacitor plugins for camera, filesystem, preferences, share, splash screen, status bar, action sheet, app, haptics, and keyboard.
- RxJS, Zone.js, TypeScript, Angular ESLint, Karma/Jasmine test tooling.

## Current Behavior

- The Android launcher activity is `com.example.app.MainActivity`.
- The app label and activity title are `My Camera`.
- The Android application id and namespace are both `com.example.app`.
- The parent Capacitor config uses `appId: 'com.example.app'`, `appName: 'myApp'`, and `webDir: 'www'`.
- The app requests `android.permission.INTERNET`.
- The app configures a `FileProvider` with external and cache paths.
- The Ionic app routes `/tabs/tab1`, `/tabs/tab2`, and `/tabs/tab3`.
- `Tab1Page` presents guide/instructional content.
- `Tab2Page` displays saved photos, opens a modal preview, and offers share, delete, edit, and info actions.
- `Tab3Page` presents sharing/instructional content.
- `PhotoService` stores photo metadata in Capacitor Preferences under key `photos`.
- Photo file data is written through Capacitor Filesystem into `Directory.Library`.
- The status bar is configured in `AppComponent` with a dark style and blue background.

## Known Problems

- `src/main/res/values/styles.xml` references `@color/colorPrimary`, `@color/colorPrimaryDark`, and `@color/colorAccent`, but no matching color resources were found under `src/main/res/values`. This is likely to cause Android resource linking failure unless the resources are generated or supplied elsewhere before build.
- `src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java` asserts package name `com.getcapacitor.app`, but the configured `applicationId` is `com.example.app`. The scaffold instrumented test is expected to fail if run unchanged.
- Native test packages still use `com.getcapacitor.myapp`, while the app package is `com.example.app`.
- The Android manifest only declares `INTERNET`; camera and media/gallery permission behavior depends on the Capacitor Camera plugin and Android version. This should be verified on real devices.
- `PhotoService.addNewToGallery()` calls `Camera.takePhoto()` without explicit `resultType` or `source`, while later code expects URI/web path fields.
- `PhotoService.editPhoto()` calls `deletePhoto()` before the edited replacement is fully saved. If editing or saving fails after deletion, the original photo metadata/file may already be removed.
- `PhotoService.sharePhoto()` passes `photo.filepath` as `url`. On Android, `filepath` may be an internal file URI rather than a shareable content URI, depending on the platform return value.
- `PhotoService.sharePhoto()` logs photo metadata to the console.
- `Tab2Page` imports `NgZone` but does not use it.
- The visible guide list in `tab1.page.html` repeats numbering for item `3`.
- `AppComponent` calls Capacitor StatusBar APIs unconditionally; this should be checked for web/browser execution behavior.

## Risks

- Configuration risk: `appId`, Android namespace, package strings, and source package are still template-style `com.example.app`.
- Build risk: missing Android color resources can block native builds.
- Runtime risk: camera, edit, file storage, and sharing flows need device-level validation because behavior differs between browser, emulator, and physical Android versions.
- Data integrity risk: photo metadata is persisted separately from file writes/deletes, so partial failures can leave stale preferences or orphaned files.
- Generated-file risk: `capacitor.build.gradle` and `../capacitor.settings.gradle` are generated by Capacitor and should not be hand-edited.
- Test quality risk: existing native tests are scaffold examples and do not cover actual photo behavior.

## Improvement Opportunities

- Add or restore Android color resources referenced by `styles.xml`.
- Update scaffold Android tests to match `com.example.app`, or replace them with meaningful app smoke tests.
- Make Camera calls explicit about `resultType`, `source`, metadata, and platform-specific expectations.
- Save edited photos before deleting originals, then clean up the original only after successful replacement.
- Normalize share behavior by using a platform-safe file/content URI supported by Capacitor Share.
- Add error handling around camera capture, edit, filesystem writes/deletes, Preferences writes, and sharing.
- Remove unused imports and console logging from production code.
- Align product identifiers before release: `appId`, Android namespace, Java package, display name, and Capacitor app name.
- Add focused tests around `PhotoService` persistence and deletion behavior.
- Verify Android permissions and media storage behavior across the target SDK version `36` and minimum SDK version `24`.
