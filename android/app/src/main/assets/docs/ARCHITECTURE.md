# Architecture

## Overview

This directory is a packaged Capacitor web asset bundle for an Ionic Angular mobile app. The actual editable application architecture likely lives in the source Ionic project outside this Android `assets` directory. Within this snapshot, architecture is visible through generated JavaScript bundles, Capacitor config files, and static assets.

At runtime, Android loads the web app through Capacitor's WebView. The generated Angular app mounts at `<app-root>`, configures Ionic providers, initializes routing, and lazy-loads the tabbed application screens.

## Runtime Layers

- Native shell: Capacitor Android hosts the web app and exposes native plugins. Native Android project files are not present in this directory.
- Capacitor bridge: `capacitor.plugins.json` registers Android plugin classes for action sheet, app lifecycle, camera, filesystem, haptics, keyboard, preferences, share, splash screen, and status bar.
- Web shell: `public/index.html` provides the app root, global Ionic styles, generated CSS, module preload hints, polyfills, and the main JavaScript module.
- Angular/Ionic app: generated bundles bootstrap the root component, set Ionic mode to `md`, configure the status bar, and install Angular router routes.
- Feature modules: route chunks lazy-load the tab shell and individual tab pages.

## Main Modules

- Root app component:
  - Selector: `app-root`.
  - Template: `ion-app` with `ion-router-outlet`.
  - Startup behavior: configures the Status Bar overlay, style, and background color.

- Router configuration:
  - Root route lazy-loads the tab route bundle.
  - `/` redirects to `/tabs/tab1`.
  - `/tabs` hosts an Ionic tab shell.
  - `/tabs/tab1` loads the guide page.
  - `/tabs/tab2` loads the photo gallery page.
  - `/tabs/tab3` loads the sharing information page.

- Tab shell:
  - Uses `ion-tabs`, bottom `ion-tab-bar`, and three `ion-tab-button` entries.
  - Labels are `Guia`, `Fotos`, and `Envio`.
  - Icons are registered from Ionicons (`book-outline`, `images-outline`, `paper-plane-outline`).

- Guide tab:
  - Static Ionic content describing the photo gallery use case.
  - Uses icon images from `public/assets/icon/`.

- Photos tab:
  - Uses a root-provided photo service visible in the generated bundle.
  - Maintains a reactive photo list.
  - Offers camera capture through a floating action button.
  - Renders saved photos in an Ionic grid.
  - Opens an Ionic modal for selected photos.
  - Uses action sheet, alert, modal, buttons, and icons for share/delete/edit/info actions.

- Sharing tab:
  - Static Ionic content describing photo sharing.
  - Uses `public/assets/icon/envio.png`.

## Data Flow

1. The WebView loads `public/index.html`.
2. `public/main-*.js` bootstraps Angular and renders `app-root`.
3. Angular Router redirects the empty path to `/tabs/tab1`.
4. The tab shell lazy-loads route chunks for each tab.
5. In the photo tab, `ngOnInit` loads saved photo metadata from Capacitor Preferences under the `photos` key.
6. When a user captures a photo, Capacitor Camera returns a photo object.
7. The photo service reads or fetches the image data depending on platform:
   - Hybrid: reads the captured file through Capacitor Filesystem.
   - Web: fetches the `webPath` blob and converts it to base64.
8. The photo service writes image data to Capacitor Filesystem, stores metadata in Preferences, and prepends the new item to the in-memory photo list.
9. On web reload, saved files are read back and converted into base64 data URLs for display.
10. Delete removes metadata from Preferences and attempts to delete the corresponding file from Filesystem.
11. Share delegates to Capacitor Share with the selected photo path.

## External Integration Points

- Camera: captures or selects images and may require platform permissions.
- Filesystem: persists photo data in an external directory.
- Preferences: stores serialized photo metadata.
- Share: invokes platform sharing UI.
- Status Bar: controls overlay, style, and color.
- Ionic overlays: modal, action sheet, alert, and toast-related code are included in generated chunks.

## Operational Notes

- Treat `public/` JavaScript and CSS files as generated build artifacts.
- Use the full Ionic/Angular source project for source edits, tests, dependency updates, and rebuilds.
- Before changing native behavior, inspect the surrounding Capacitor project, including Android manifests, platform permissions, Gradle configuration, and the source `capacitor.config.*`.
- Plugin compatibility must be validated against the installed Capacitor version in the full project, which cannot be determined from this directory alone.
- The package manager is expected to be npm, but this directory has no npm manifest or lockfile.
