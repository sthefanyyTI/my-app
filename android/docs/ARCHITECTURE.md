# Architecture

## Overview

The Android project is a Capacitor host for an Ionic Angular application. The parent web project builds browser assets into `../www`; Capacitor syncs those assets and native plugin metadata into this Android directory; the Android app launches a Capacitor `BridgeActivity` that hosts the web application in a WebView and exposes native plugins through Capacitor.

The native Android code is currently minimal. There is no custom Java/Kotlin application logic beyond the launcher activity subclass.

## Main Modules

### Root Gradle Project

The root Gradle project is defined by `settings.gradle` and top-level Gradle files:

- `settings.gradle` includes `:app`, includes `:capacitor-cordova-android-plugins`, and applies generated Capacitor settings.
- `build.gradle` configures global repositories and root Android/Google Services buildscript classpaths.
- `variables.gradle` holds shared SDK and dependency version constants.
- `gradle.properties` configures AndroidX and several Android Gradle Plugin behavior flags.
- `gradle/wrapper/gradle-wrapper.properties` pins Gradle 9.3.1.

### App Module

The `:app` module is the installable Android application.

Key files:

- `app/build.gradle`
- `app/src/main/AndroidManifest.xml`
- `app/src/main/java/com/example/app/MainActivity.java`
- `app/src/main/res/`
- `app/capacitor.build.gradle`

Responsibilities:

- Defines `namespace` and `applicationId` as `com.example.app`.
- Sets app version code/name.
- Depends on Capacitor Android and generated Capacitor plugin modules.
- Declares the launcher activity.
- Provides Android resources, launch theme, app name, launcher icons, splash images, and FileProvider paths.
- Optionally applies Google Services when `app/google-services.json` exists and has content.

### Capacitor Android Module

`capacitor.settings.gradle` includes `:capacitor-android` from:

`../node_modules/@capacitor/android/capacitor`

This is the Capacitor native runtime that provides `BridgeActivity`, WebView hosting, plugin dispatch, and the JavaScript/native bridge.

### Capacitor Plugin Modules

`capacitor.settings.gradle` includes plugin Android projects from `../node_modules`, and `app/capacitor.build.gradle` adds them as `implementation` dependencies.

Included plugins:

- `:capacitor-action-sheet`
- `:capacitor-app`
- `:capacitor-camera`
- `:capacitor-filesystem`
- `:capacitor-haptics`
- `:capacitor-keyboard`
- `:capacitor-preferences`
- `:capacitor-share`
- `:capacitor-splash-screen`
- `:capacitor-status-bar`

These modules provide native Android implementations for APIs used by the Ionic web app.

### Cordova Compatibility Module

The `:capacitor-cordova-android-plugins` module supports Cordova-compatible plugin integration.

Key files:

- `capacitor-cordova-android-plugins/build.gradle`
- `capacitor-cordova-android-plugins/cordova.variables.gradle`
- `capacitor-cordova-android-plugins/src/main/AndroidManifest.xml`

The module is generated and currently has placeholder sections for plugin-specific dependencies/extensions, with no listed sub-project dependencies between the generated markers.

### Parent Ionic Project

Although this analysis focuses on `/android`, the Android project depends on the parent Ionic project for web assets and Capacitor configuration.

Relevant parent files:

- `../package.json`
- `../package-lock.json`
- `../capacitor.config.ts`
- `../angular.json`
- `../ionic.config.json`

The parent project is an Angular standalone Ionic app. Angular builds to `www`, matching `webDir: 'www'` in `capacitor.config.ts`.

## Data Flow

1. Developers build the Ionic Angular app in the parent project, producing web output in `../www`.
2. Capacitor sync/update commands generate or refresh Android platform files, copied web assets, native plugin lists, and generated Gradle files.
3. Gradle builds the Android project. `settings.gradle` wires the app module, Capacitor runtime, plugin modules, and Cordova compatibility module into one build.
4. Android launches `MainActivity`.
5. `MainActivity` extends `BridgeActivity`, which initializes Capacitor and hosts the web app in a WebView.
6. Web code calls Capacitor JavaScript APIs.
7. Capacitor dispatches those calls to the included native plugin modules.
8. Native plugin results are returned through the bridge to the web runtime.

## Native Entry Points

- Launcher activity: `com.example.app.MainActivity`
- Base class: `com.getcapacitor.BridgeActivity`
- Manifest activity launch mode: `singleTask`
- Manifest config changes handled by the activity include orientation, keyboard, screen size, locale, UI mode, navigation, density, and related device configuration changes.
- File sharing authority: `${applicationId}.fileprovider`

## Resource and Configuration Notes

- `strings.xml` sets `app_name` and `title_activity_main` to `My Camera`.
- `styles.xml` defines:
  - `AppTheme` using AppCompat light dark action bar.
  - `AppTheme.NoActionBar` using AppCompat DayNight no action bar.
  - `AppTheme.NoActionBarLaunch` using `Theme.SplashScreen` with `@drawable/logo_camera` as Android background.
- Splash and launcher image assets are present in density-specific resource folders.
- `app/src/main/res/xml/config.xml` permits `<access origin="*" />` for Cordova compatibility.
- `app/src/main/res/xml/file_paths.xml` grants FileProvider access to external and cache roots.

## Testing

The project currently contains scaffold tests:

- `app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`
- `app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java`

The unit test only verifies `2 + 2 == 4`. The instrumented test still asserts the scaffold package `com.getcapacitor.app`, which does not match this app's configured `applicationId`.

## Operational Notes

- Generated files marked with comments such as `DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN` should be changed through Capacitor configuration or plugin installation/sync flows instead of direct manual edits.
- Native plugin membership is controlled by the parent project's npm dependencies plus Capacitor sync/update output.
- `app/src/main/assets/public`, `app/src/main/assets/capacitor.config.json`, and `app/src/main/assets/capacitor.plugins.json` are ignored generated outputs and may not exist until Capacitor sync/build steps populate them.
- The current Android project can be opened in Android Studio, but the parent npm dependencies and generated Capacitor module paths must exist because Gradle references `../node_modules`.
- No custom native domain layer, repository layer, local database, network client, or background service was found in this Android directory.
