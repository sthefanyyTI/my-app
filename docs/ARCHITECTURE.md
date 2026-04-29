# Architecture

Analysis date: 2026-04-28.

## Overview

`myApp` is a standalone Ionic Angular application with Capacitor as the native runtime bridge. Angular owns the web application structure, Ionic provides mobile UI components and navigation patterns, and Capacitor provides native Android access for camera, filesystem, preferences, sharing, and status bar behavior.

The architecture is intentionally small:

- A root standalone Angular component hosts the Ionic app shell.
- A tabs route tree provides three page-level feature areas.
- A single injectable photo service owns gallery state and native plugin calls.
- Capacitor wraps the Angular build output from `www/` into the Android project.

## Runtime Composition

### Bootstrap

`src/main.ts` calls `bootstrapApplication(AppComponent, ...)` and registers:

- `IonicRouteStrategy` for Ionic navigation behavior.
- `provideIonicAngular({ mode: 'md' })` to force Material Design mode.
- `provideRouter(routes, withPreloading(PreloadAllModules))` for Angular routing.

`src/app/app.component.ts` imports `IonApp` and `IonRouterOutlet`, then configures the Capacitor Status Bar during `ngOnInit()`.

### Routing

`src/app/app.routes.ts` defines one root route:

- `path: ''` lazy-loads `src/app/tabs/tabs.routes.ts`.

`src/app/tabs/tabs.routes.ts` defines:

- `/tabs/tab1` -> `Tab1Page`
- `/tabs/tab2` -> `Tab2Page`
- `/tabs/tab3` -> `Tab3Page`
- empty child path -> redirect to `/tabs/tab1`
- empty root path -> redirect to `/tabs/tab1`

Each tab page is a standalone component loaded with `loadComponent()`.

## Main Modules

### App Shell

Files:

- `src/app/app.component.ts`
- `src/app/app.component.html`
- `src/app/app.routes.ts`
- `src/app/tabs/tabs.page.ts`
- `src/app/tabs/tabs.page.html`
- `src/app/tabs/tabs.routes.ts`

Responsibilities:

- Host Ionic app and router outlet.
- Configure global status bar appearance.
- Render the bottom tab bar.
- Register Ionicons used by the tab buttons.

### Guide Page

Files:

- `src/app/tab1/tab1.page.ts`
- `src/app/tab1/tab1.page.html`
- `src/app/tab1/tab1.page.scss`

Responsibilities:

- Display static Portuguese onboarding content.
- Use local icon assets to describe gallery, storage, sharing, privacy, and memory capture features.

### Photo Gallery Page

Files:

- `src/app/tab2/tab2.page.ts`
- `src/app/tab2/tab2.page.html`
- `src/app/tab2/tab2.page.scss`

Responsibilities:

- Load saved photos on page initialization.
- Render the current `PhotoService.photos` signal as a grid.
- Capture a new photo from the floating action button.
- Open a selected photo in a modal.
- Provide UI actions for sharing, deleting, editing, and showing metadata.
- Use Ionic modal, alert, action sheet, grid, fab, and button components.

### Sending/Sharing Info Page

Files:

- `src/app/tab3/tab3.page.ts`
- `src/app/tab3/tab3.page.html`
- `src/app/tab3/tab3.page.scss`

Responsibilities:

- Display static Portuguese content explaining photo sharing.
- Use `assets/icon/envio.png` as the page image.

### Photo Service

File:

- `src/app/services/photo.service.ts`

Responsibilities:

- Hold gallery state in `photos = signal<UserPhoto[]>([])`.
- Capture photos with `@capacitor/camera`.
- Read and write image files with `@capacitor/filesystem`.
- Store and restore photo metadata with `@capacitor/preferences`.
- Convert native file paths for WebView display with `Capacitor.convertFileSrc()`.
- Share photos with `@capacitor/share`.
- Branch behavior for hybrid/native vs web runtime with Ionic `Platform`.

Primary data model:

```ts
export interface UserPhoto {
  fileName: string;
  filepath: string;
  webviewPath?: string;
  realPath: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  format: string;
  platform: string;
  device: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

## Data Flow

### Capture

1. `Tab2Page.addPhotoToGallery()` calls `PhotoService.addNewToGallery()`.
2. `PhotoService` calls `Camera.takePhoto()`.
3. `savePicture()` reads the captured image:
   - Hybrid runtime: `Filesystem.readFile({ path: photo.uri! })`.
   - Web runtime: fetches `photo.webPath`, converts the Blob to base64.
4. The image is written to `Directory.Library`.
5. A `UserPhoto` object is created with file paths, timestamps, size, format, platform, and device fields.
6. The new photo is prepended to the `photos` signal.
7. The updated metadata array is persisted to Preferences under key `photos`.

### Load

1. `Tab2Page.ngOnInit()` calls `PhotoService.loadSaved()`.
2. `Preferences.get({ key: 'photos' })` retrieves serialized metadata.
3. The metadata array is assigned to the `photos` signal.
4. On web runtime only, each file is read back from `Directory.Library` and converted to a `data:image/jpeg;base64,...` URL for display.

### Edit

1. `Tab2Page.editPhoto(photo)` calls `PhotoService.editPhoto(photo)`.
2. `Camera.editURIPhoto()` opens the native edit flow for `photo.realPath`.
3. The original photo is deleted from metadata and storage.
4. The edited result is saved through `savePicture()`.
5. The updated metadata is persisted back to Preferences.

### Delete

1. The delete alert destructive button calls `PhotoService.deletePhoto(photo, position)`.
2. The service removes the indexed photo from the `photos` signal.
3. The updated metadata array is written to Preferences.
4. The underlying image file is deleted from `Directory.Library`.

### Share

The intended architecture is:

1. The UI selects a `UserPhoto`.
2. `Tab2Page` delegates to `PhotoService.sharePhoto(photo)`.
3. `PhotoService` calls `Share.share()` with title, text, URL, and dialog title.

Current implementation note: `Tab2Page.sharePhoto()` currently calls itself recursively, so the UI does not reach `PhotoService.sharePhoto()` as written.

## Native Android Integration

Capacitor configuration:

- `capacitor.config.ts`
  - `appId`: `com.example.app`
  - `appName`: `myApp`
  - `webDir`: `www`

Android project:

- `android/app/build.gradle` defines application id `com.example.app`, SDK levels, app version, and Capacitor dependencies.
- `android/app/src/main/AndroidManifest.xml` defines `MainActivity`, launcher intent filter, FileProvider, and `INTERNET` permission.
- `android/app/src/main/assets/capacitor.plugins.json` records the installed native Capacitor plugins.
- `android/app/src/main/assets/public/` contains copied web build assets from a prior sync/build.

## Styling and Assets

- `src/global.scss` imports required Ionic base CSS, optional Ionic utility CSS, and the system dark-mode palette.
- `src/theme/variables.scss` defines the primary color palette and light/dark `ion-content` background behavior.
- Page-specific SCSS files are present under each page directory.
- Static PNG icons live under `src/assets/icon/` and are copied into build output by Angular asset configuration.

## Tests and Quality Gates

Configured scripts:

- `npm run start`: Angular dev server.
- `npm run build`: Angular production build to `www/`.
- `npm run watch`: Angular development build watcher.
- `npm run test`: Karma/Jasmine tests.
- `npm run lint`: Angular ESLint.

Current test files exist for the root component, tabs, three tab pages, explore container, and photo service. Existing specs are mostly creation tests and do not exercise the native plugin workflows or photo state transitions.

Current lint status is failing due to Angular ESLint findings in `PhotoService` and `Tab2Page`.

## Operational Notes

- Use npm commands because `package-lock.json` is present.
- Build output is configured to `www/`, which Capacitor uses as `webDir`.
- After web changes, Capacitor Android assets normally need to be refreshed with the project's Capacitor sync/copy workflow before native Android builds use the latest web bundle.
- Avoid committing generated build output unless the project intentionally tracks it.
- Validate camera, edit, filesystem, and share flows on an Android device or emulator because browser behavior and native URI behavior differ.
- The current application id and namespace are template values and should be changed before production distribution.
