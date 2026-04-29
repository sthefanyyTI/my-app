# Architecture

## Overview

The project is a Capacitor-based Android wrapper around an Ionic/Angular standalone application. The Android module provides the native entry point, app identity, resources, platform permissions, file provider configuration, and Capacitor plugin wiring. The application screens and photo-gallery behavior live in the adjacent Angular source tree under `../../src`.

At runtime, Android launches `MainActivity`, which inherits from Capacitor `BridgeActivity`. Capacitor loads the built web assets from the configured `www` directory and exposes native plugin APIs to the Angular application.

## Native Android Layer

### App Module

`build.gradle` defines the Android application module:

- Applies `com.android.application`.
- Sets `namespace` and `applicationId` to `com.example.app`.
- Uses SDK values from `../variables.gradle`:
  - `minSdkVersion = 24`
  - `compileSdkVersion = 36`
  - `targetSdkVersion = 36`
- Sets `versionCode 1` and `versionName "1.0"`.
- Disables minification for release builds.
- Depends on Capacitor Android, Capacitor/Cordova plugins, AndroidX libraries, and test libraries.
- Applies generated Capacitor wiring from `capacitor.build.gradle`.
- Applies Google Services only if `google-services.json` is present.

### Main Activity

`src/main/java/com/example/app/MainActivity.java` contains a minimal native activity:

```java
package com.example.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

There is no custom native behavior in the activity. Navigation, UI, camera usage, storage, and sharing are handled from the Ionic/Angular side through Capacitor.

### Manifest

`src/main/AndroidManifest.xml` defines:

- Application label and icons.
- Launcher activity `.MainActivity`.
- `singleTask` launch mode.
- Extensive `configChanges` handling typical of Capacitor activity setup.
- `androidx.core.content.FileProvider` with authority `${applicationId}.fileprovider`.
- `android.permission.INTERNET`.

### Resources

Important Android resources:

- `src/main/res/values/strings.xml`: app name, activity title, package string, and URL scheme.
- `src/main/res/values/styles.xml`: app theme, no-action-bar theme, and splash launch theme.
- `src/main/res/drawable/logo_camera.png`: launch background used by `AppTheme.NoActionBarLaunch`.
- `src/main/res/drawable*/splash.png`: splash assets.
- `src/main/res/mipmap*/`: launcher icons.
- `src/main/res/xml/file_paths.xml`: file provider paths for external and cache storage.
- `src/main/res/xml/config.xml`: Cordova-style access config with `<access origin="*" />`.

## Capacitor Layer

The parent Capacitor config at `../../capacitor.config.ts` declares:

- `appId: 'com.example.app'`
- `appName: 'myApp'`
- `webDir: 'www'`

Generated Capacitor files connect native modules:

- `../capacitor.settings.gradle` includes Capacitor Android and plugin Gradle projects from `../../node_modules`.
- `capacitor.build.gradle` adds plugin dependencies for action sheet, app, camera, filesystem, haptics, keyboard, preferences, share, splash screen, and status bar.
- `capacitor.build.gradle` also configures Java source and target compatibility as Java 21.

## Web Application Layer

The app root is an Angular standalone application configured by `../../angular.json` and bootstrapped from `../../src/main.ts`.

### Bootstrap

`../../src/main.ts`:

- Bootstraps `AppComponent` using `bootstrapApplication`.
- Provides Ionic Angular in Material Design mode.
- Provides Angular Router with preloading for all modules.
- Uses `IonicRouteStrategy`.

`../../src/app/app.component.ts`:

- Hosts the Ionic router outlet.
- Configures the Capacitor Status Bar on initialization.

### Routing

Routing is split across:

- `../../src/app/app.routes.ts`
- `../../src/app/tabs/tabs.routes.ts`

Route structure:

- `/` loads tab routes.
- `/tabs/tab1` loads `Tab1Page`.
- `/tabs/tab2` loads `Tab2Page`.
- `/tabs/tab3` loads `Tab3Page`.
- Empty tab routes redirect to `/tabs/tab1`.

### UI Modules

- `Tab1Page`: guide/introduction content for the photo gallery app.
- `Tab2Page`: interactive photo gallery, camera capture button, modal preview, share/delete/edit/info actions.
- `Tab3Page`: sharing/instructions content.
- `TabsPage`: bottom tab navigation with Ionicons.
- `ExploreContainerComponent`: scaffold component still present, but not part of active tab templates.

## Photo Data Flow

### Capture Flow

1. User taps the floating camera button in `Tab2Page`.
2. `Tab2Page.addPhotoToGallery()` calls `PhotoService.addNewToGallery()`.
3. `PhotoService` calls Capacitor Camera's `takePhoto()`.
4. `savePicture()` reads the captured file:
   - Hybrid/native: reads from `photo.uri` using Capacitor Filesystem.
   - Web: fetches `photo.webPath`, converts the blob to base64.
5. The image is written to `Directory.Library`.
6. A `UserPhoto` metadata object is created.
7. The in-memory Angular signal is updated.
8. The metadata array is serialized to Capacitor Preferences under key `photos`.

### Load Flow

1. `Tab2Page.ngOnInit()` calls `PhotoService.loadSaved()`.
2. Preferences are read from key `photos`.
3. The `photos` signal is populated.
4. On web, each stored file is read back from `Directory.Library` and converted into a `data:image/jpeg;base64,...` webview path.

### Preview and Actions

1. User taps a photo tile in `Tab2Page`.
2. The selected photo and position are stored in Angular signals.
3. An Ionic modal shows the image.
4. Modal actions call service methods for share, delete, or edit, or build an alert with photo metadata.

### Edit Flow

1. `Tab2Page.editPhoto()` calls `PhotoService.editPhoto(photo)`.
2. `Camera.editURIPhoto()` opens native editing for `photo.realPath`.
3. The original photo is deleted through `deletePhoto()`.
4. The edited photo is saved through `savePicture()`.
5. The photos signal and Preferences are updated.

### Delete Flow

1. The user confirms deletion in an Ionic alert.
2. `PhotoService.deletePhoto(photo, position)` removes the metadata item from the signal.
3. Preferences are updated.
4. The file is deleted from `Directory.Library`.

### Share Flow

1. User taps share in the modal.
2. `PhotoService.sharePhoto(photo)` calls Capacitor Share with title, text, URL, and dialog title.

## Persistence Model

The app persists two related data sets:

- Photo files in Capacitor Filesystem `Directory.Library`.
- Photo metadata in Capacitor Preferences under the key `photos`.

The metadata schema is represented by `UserPhoto` and includes file name, path fields, timestamps, size, format, platform, device, and optional location.

## Testing

Native tests are scaffold-level only:

- `src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java` verifies `2 + 2 == 4`.
- `src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java` checks an outdated scaffold package name.

Angular spec files exist for the app component, tabs, pages, explore container, and photo service under `../../src/app`, but this analysis did not execute tests.

## Operational Notes

- Build web assets from the parent project with npm scripts such as `npm run build` before syncing/running the Android app through Capacitor workflows.
- Android builds are run from the Android project under `../`, while package management is controlled from the parent npm project at `../../`.
- Generated Capacitor Gradle files should be regenerated with Capacitor commands instead of manually edited.
- The repository has a lockfile, so dependency installation should use the locked npm state when installation is actually needed.
- The Android module currently contains documentation and prompt files created for agent analysis; those are separate from application runtime code.
