# @micropasts/splat-viewer

A lightweight React viewer for 3D Gaussian splats, built on [Three.js](https://threejs.org/) and [SparkJS](https://sparkjs.dev/). Built for cultural heritage, archaeology and scientific inspection, with a metadata and paradata record, a physical scale bar, splat-specific telemetry, curated camera viewpoints, shareable view links and local file loading.

The demo shows a scan of a colossal marble foot. It is a companion to [`@micropasts/glb-model-viewer`](https://github.com/micropasts/glb-viewer), and the paradata drawer, scale bar and telemetry drawer follow the same design.

## Features

- **Gaussian splat rendering**: `.ply`, `.spz`, `.splat`, `.ksplat` and `.sog` files, plus `.rad` with paged streaming, rendered with SparkJS.
- **Local files**: drag a file onto the viewer or use the **Open** button; no server or URL is needed.
- **Splat telemetry drawer**: splat count, file size, format, dimensions, density, spherical harmonics (SH) bands and opacity.
- **Scale bar**: a zebra scale bar with reference object silhouettes, shown when you supply `mmPerUnit`.
- **Paradata record**: object metadata, capture and reconstruction details, splat data provenance and derived assets in an accessible dialog.
- **Curated viewpoints**: saved camera positions with a previous/next stepper and `[` / `]` shortcuts.
- **Render controls**: opacity, SH bands (0-3), grid, bounding box, turntable rotation and camera presets (Iso, Front, Top, Side).
- **Background colour**: four presets plus a custom colour picker, saved in `localStorage` and included in share links.
- **Shareable view links**: the camera, opacity, SH bands and background colour are encoded in the URL hash.
- **Export**: PNG viewport snapshot and download of the source asset.
- **Light and dark UI themes**, fullscreen mode and keyboard shortcuts.
- **Modular**: switch features off with props, or import the HUD components directly.

---

## Installation

```bash
npm install @micropasts/splat-viewer
```

`react` and `react-dom` (`>=18`) are peer dependencies. `three` and `@sparkjsdev/spark` are regular dependencies and are installed for you. The bundled styles use Tailwind CSS 4 and need a modern browser with WebGL 2 (Safari 16.4+, Chrome 111+, Firefox 128+).

For development, run `npm install`, then:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the demo with hot reload |
| `npm run build` | Build the library into `dist/` |
| `npm run build:docs` | Build the demo site into `docs/` |
| `npm run preview` | Preview a production build |

---

## Usage in Your App

### 1. Basic React / Vite setup

Import `SplatViewer` and its stylesheet. Wrap the viewer in a container with an explicit height.

```jsx
import { SplatViewer } from '@micropasts/splat-viewer';
import '@micropasts/splat-viewer/styles.css';

export default function ArtifactPage() {
    return (
        <div style={{ width: '100%', height: '650px' }}>
            <SplatViewer
                splatUrl="/splats/colossal-foot.spz"
                title="Colossal Foot"
                subtitle="Compressed SPZ Gaussian splat"
                badge="SPZ"
                fileName="colossal-foot.spz"
                initialTheme="dark"
                onLoad={(stats) => console.log('Loaded', stats)}
            />
        </div>
    );
}
```

`SplatViewer` is both the default and a named export.

> [!IMPORTANT]
> The viewer fills `100%` of its parent (`width: 100%; height: 100%`). Always give the wrapping element an explicit height, such as `height: 100vh` or `600px`, otherwise the canvas collapses to `0px`.

### 2. Serving a file from your project

Put the splat in your static folder and pass its URL. With Vite the static folder is `public/`:

```text
public/splats/colossal-foot.spz  ->  splatUrl="/splats/colossal-foot.spz"
```

If your app is deployed under a sub-path, build the URL from the base:

```jsx
splatUrl={`${import.meta.env.BASE_URL}splats/colossal-foot.spz`}
```

The demo in this repository keeps its files in `demo/public/` (set through `publicDir` in `vite.config.js`).

A browser cannot read an arbitrary path on a user's disk, and `file://` URLs are blocked for web pages. To load a file chosen at runtime, use drag-and-drop or the **Open** button (see [Local files](#local-files)).

### 3. Customizing visible tools

Every panel and tool can be switched off with a boolean prop. For a minimal embed card:

```jsx
<div className="w-full h-[420px]">
    <SplatViewer
        splatUrl="/splats/colossal-foot.spz"
        title="Colossal Foot"
        initialTheme="light"
        showParadata={false}
        showTelemetry={false}
        showScaleBar={false}
        showThemeToggle={false}
        enableFullscreen={false}
        enableExport={false}
        enableDeepLink={false}
        enableLocalFiles={false}
    />
</div>
```

Custom JSX passed as `children` renders inside the viewer's root element, above the canvas.

### 4. Next.js (App Router)

The viewer needs `window` and WebGL, so load it on the client only:

```jsx
'use client';

import dynamic from 'next/dynamic';
import '@micropasts/splat-viewer/styles.css';

const SplatViewer = dynamic(() => import('@micropasts/splat-viewer'), { ssr: false });

export default function Page() {
    return (
        <div style={{ height: '80vh' }}>
            <SplatViewer splatUrl="/splats/colossal-foot.spz" title="Colossal Foot" />
        </div>
    );
}
```

### 5. Lazy loading

SparkJS embeds a WebAssembly build and is around 2.7 MB, so load the viewer lazily if it is not needed on first paint:

```jsx
import { lazy, Suspense } from 'react';

const SplatViewer = lazy(() => import('@micropasts/splat-viewer'));

<Suspense fallback={<p>Loading viewer…</p>}>
    <SplatViewer splatUrl="/splats/colossal-foot.spz" />
</Suspense>;
```

---

## Local files

With `enableLocalFiles` (the default), users can open a splat from their own device:

- **Drag and drop** a file onto the viewer.
- Click **Open** in the top bar.

Accepted extensions are `.ply`, `.spz`, `.splat`, `.ksplat`, `.sog` and `.zip`. The file is read in the browser and is never uploaded. Behaviour for local files:

- They always load in full (no paged streaming).
- The telemetry drawer shows the file's name and exact size.
- **Source Splat Asset** is hidden from the Export menu, because there is no URL to download.
- Opening a file clears any `#view=` link from the address bar. A share link made from a local file only works on your own device, since the file is not embedded in it.
- `splatUrl` is optional. With no URL and no file, the viewer shows a "drop a file" prompt.

---

## Handling scale

Splats are usually trained without real-world units, so the viewer reports sizes in scene units (`u`) until you say otherwise. Pass `mmPerUnit`, the number of millimetres in one scene unit, to enable real measurements:

```jsx
// The splat is 2.136 units wide and the real object is 320 mm wide.
<SplatViewer splatUrl="/splats/foot.spz" mmPerUnit={320 / 2.136} measureUnit="cm" />
```

With `mmPerUnit` set:

- the scale bar is drawn and follows the camera zoom;
- the telemetry drawer shows dimensions in `mm`, `cm` or `in` instead of scene units;
- the scale status reads as scaled.

Read the current scene-unit dimensions from the telemetry drawer or from `onLoad` (`stats.size`). Without `mmPerUnit`, no scale bar is shown, because a bar drawn from guessed units would be misleading.

---

## Props Reference

### Core and asset props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `splatUrl` | `string` | `undefined` | URL of the splat asset. Optional: with no URL, users can open a local file. Must be reachable from the page and CORS-enabled if cross-origin. |
| `fileName` | `string` | `'splat'` | Name used for the downloaded source asset and the snapshot PNG. |
| `title` | `string` | `'Gaussian Splat'` | Heading in the top bar. |
| `subtitle` | `string` | `''` | Secondary line under the title. |
| `badge` | `string` | `'SPLAT'` | Short format label shown next to the title, such as `SPZ`. |
| `backUrl` | `string \| null` | `null` | When set, a back link appears in the top bar. |
| `paged` | `boolean` | auto | Force paged (streamed) loading on or off. By default it is on only for `.rad` URLs. Ignored for local files. |
| `flipY` | `boolean` | `true` | Applies the common 180° flip used by splats captured with a Y-down convention. Set `false` if your splat appears upside down. |
| `viewpoints` | `Viewpoint[]` | `[]` | Curated camera positions. See [Viewpoints](#viewpoints). |

### Appearance and background

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `initialTheme` | `'dark' \| 'light'` | `'dark'` | Initial UI theme. Users can change it with the theme toggle. The default background follows the theme until the user picks one. |
| `initialBackground` | `string` | `'#090d16'` | Initial background colour as a `#rrggbb` hex value. With the light theme and the default value, the background starts as `#f1f5f9`. |
| `persistBackground` | `boolean` | `true` | Save the user's background colour in `localStorage` (key `splat-viewer:bgColor`) and restore it next time. When `false`, any saved colour is ignored and nothing is saved, so `initialBackground` always wins. |

The saved colour is a single key per origin, shared by every viewer on that origin. Share links also carry the background colour: a link's colour is applied when it is opened, even if `persistBackground` is `false`.

### Scale and measurement

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mmPerUnit` | `number \| null` | `null` | Millimetres per scene unit. Enables the scale bar and real-world dimensions. |
| `measureUnit` | `'mm' \| 'cm' \| 'in'` | `'mm'` | Unit for the scale bar and the telemetry dimensions. |
| `showScaleBar` | `boolean` | `true` | Show the scale bar. It also needs `mmPerUnit`. |

### UI and tool toggles

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `showTelemetry` | `boolean` | `true` | Show the info button and telemetry drawer (`I`). |
| `showParadata` | `boolean` | `true` | Show the Paradata button. It only appears when a `paradata` record is supplied. |
| `showThemeToggle` | `boolean` | `true` | Show the light/dark toggle. |
| `enableFullscreen` | `boolean` | `true` | Show the fullscreen button. |
| `enableExport` | `boolean` | `true` | Show the Export menu (snapshot and source download). |
| `enableDeepLink` | `boolean` | `true` | Show the copy-link button and apply a `#view=` hash on load. |
| `enableLocalFiles` | `boolean` | `true` | Allow the **Open** button and drag-and-drop. |

### Metadata and paradata

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `paradata` | `object \| null` | `null` | Metadata and paradata record. See [Paradata](#paradata). |

### Callbacks and children

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `onLoad` | `(stats: SplatStats) => void` | `null` | Called when the splat has loaded and rendered. |
| `onError` | `(error: unknown) => void` | `null` | Called if fetching or parsing the splat fails. |
| `children` | `React.ReactNode` | `null` | Custom elements rendered inside the viewer's root element. |

`onLoad` receives:

| Field | Type | Description |
| --- | --- | --- |
| `splatCount` | `number` | Number of splats in the asset. |
| `paged` | `boolean` | Whether the asset is streamed in pages. |
| `box` | `THREE.Box3` | World-space bounds, with outlier splats trimmed. |
| `center` | `THREE.Vector3` | Centre of `box`. |
| `size` | `THREE.Vector3` | Size of `box` in scene units. |

The bounds use the 5th to 95th percentile of the centres of reasonably opaque splats, so stray floaters do not skew framing, the grid or the bounding box. For paged assets the raw bounds are used.

### Viewpoints

```jsx
const viewpoints = [
    { title: 'Front', position: [0, 0.4, 3], target: [0, 0, 0] },
    { title: 'Sole detail', position: [1.2, -0.5, 1.5] },
];

<SplatViewer splatUrl="/splats/colossal-foot.spz" viewpoints={viewpoints} />
```

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | Label shown in the viewpoint bar. Defaults to `Viewpoint N`. |
| `position` | `[x, y, z]` | Camera position in scene units. Required. |
| `target` | `[x, y, z]` | Point the camera looks at. Defaults to the current orbit target. |

When any viewpoints are supplied, a stepper bar appears. Selecting one flies the camera there; `[` and `]` step through them.

---

## Paradata

Pass a JavaScript object parsed from JSON or returned by an API. The viewer does not fetch it for you. All sections are optional, and empty ones are hidden. The Paradata button appears only when a record is supplied and `showParadata` is `true`. Close, `Esc` or the backdrop closes the dialog.

```jsx
import paradata from './paradata.json';

<SplatViewer splatUrl="/splats/colossal-foot.spz" paradata={paradata} />
```

```json
{
    "recordId": "COLOSSAL-FOOT",
    "objectMetadata": [{ "label": "Material", "value": "Marble" }],
    "processingSummary": {
        "fields": [{ "label": "Training software", "value": "Postshot" }],
        "ratings": [{ "label": "Coverage", "value": "80%" }]
    },
    "splatComponents": [
        { "name": "Colour and spherical harmonics", "statuses": ["MEASURED"], "notes": "SH degree 3" }
    ],
    "labNotes": "Captured handheld in gallery light.",
    "derivedAssets": {
        "software": "Postshot",
        "assets": [
            {
                "asset": "Splat",
                "splats": "773,437",
                "shBands": "3",
                "training": "30k steps",
                "filename": "colossal-foot.spz",
                "format": "SPZ",
                "size": "11.5 MB",
                "downloadUrl": "/splats/colossal-foot.spz"
            }
        ]
    }
}
```

| Field | Shape | Description |
| --- | --- | --- |
| `recordId` | `string` | Appended to the default dialog heading. |
| `title` | `string` | Overrides the dialog heading. |
| `objectMetadata` | `{ label, value }[]` | Object details. |
| `processingSummary` | `{ fields?, ratings? }` | "Capture & Reconstruction" section. Each is an array of `{ label, value }`. |
| `splatComponents` | `{ name, statuses?, notes? }[]` | "Splat Data Provenance" section. `paradata.textureMaps` is accepted as an alias. |
| `assessment` | `{ label, value }[]` | Condition and recording assessment. |
| `captureTolerances` | `{ label, value }[]` | Camera, lens, lighting and accuracy. |
| `labNotes` | `string` | Free-text notes. |
| `acquisitionChunks` | `{ chunk, exposure, opticsAndFocus, rotationalSteps, images }[]` | Capture sessions. |
| `derivedAssets` | `{ software?, assets? }` | Derived files. Each asset accepts `asset`, `splats`, `shBands`, `training`, `alignment`, `tiePoints`, `filename`, `format`, `size` and optional `downloadUrl`. |
| `extraSections` | `{ title, fields?, notes? }[]` | Additional custom sections. |

`label`/`value` values can be strings, numbers or booleans. Status colours recognise `MEASURED`, `ESTIMATED`, `PATCHED`, `SYNTHETIC` and `NOT CREATED`; other values use a neutral style. Missing table cells display a dash.

Treat `downloadUrl` values as trusted links, or validate them before passing the record in. The demo uses [`demo/paradata.json`](./demo/paradata.json), which holds placeholder values: entries marked "Not documented" are not statements about the real capture.

---

## Share links

The **link** button copies the page URL with a `#view=` hash that encodes the camera position, orbit target, opacity, SH bands and background colour. Opening the link restores that view once the splat has loaded. Values in the hash are validated: invalid vectors, an opacity outside 0.05-1, SH bands outside 0-3 or a non-hex colour cause that part (or the whole hash, for bad camera vectors) to be ignored.

Disable this with `enableDeepLink={false}`.

---

## Exported components and helpers

```javascript
import SplatViewer, {
    SplatViewer,
    ParadataDrawer,
    ScaleBarOverlay,
    createSparkRenderer,
    loadSplatAsset,
} from '@micropasts/splat-viewer';
```

The HUD components are presentation components. When used on their own, the host provides their state and handlers. Render them inside an element with the `sv-root` class so the scoped styles apply, and add `dark` for the dark theme.

### `ScaleBarOverlay`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `pixelsPerMm` | `number` | required | Screen pixels per millimetre at the displayed depth. Nothing is drawn when it is not a positive number. |
| `isUnscaled` | `boolean` | required | When `true`, nothing is drawn. |
| `measureUnit` | `'mm' \| 'cm' \| 'in'` | `'mm'` | Unit of the bar label. |
| `allowReferenceToggle` | `boolean` | `true` | Allow the drawer of reference objects (AA cell, tennis ball, 330 ml can, A4 sheet). |

```jsx
<div className="sv-root dark">
    <ScaleBarOverlay pixelsPerMm={1.2} isUnscaled={false} measureUnit="cm" />
</div>
```

### `ParadataDrawer`

| Prop | Type | Description |
| --- | --- | --- |
| `isOpen` | `boolean` | Whether the dialog is shown. |
| `onClose` | `() => void` | Called when the dialog is dismissed. |
| `paradata` | `object` | The record to display. See [Paradata](#paradata). |

### `createSparkRenderer` and `loadSplatAsset`

Lower-level helpers for building your own viewer.

```javascript
const spark = createSparkRenderer(threeRenderer);
scene.add(spark);

const { splatMesh, stats, dispose } = await loadSplatAsset({
    url: '/splats/colossal-foot.spz',
    parentGroup: scene,
});
```

`loadSplatAsset` accepts `url` or `file` (a `File`), `parentGroup` (required), `paged`, `maxSh` (default `3`), `opacity` (default `1`), `flipY` (default `true`) and an `isCancelled` callback. It resolves to `{ splatMesh, stats, dispose }`, or `null` if cancelled. Call `dispose()` to release GPU resources.

---

## Troubleshooting

### The splat fails to load or the browser reports CORS errors

- Open the browser's **Network** and **Console** tabs and check the status code and URL of the failing request. Pass `onError={(e) => console.error(e)}` to see load and parse errors.
- Serve the app and the splat over HTTP(S), not as a `file://` page. Check that `splatUrl` returns the file and not an HTML error page.
- If the splat is on another origin, that server must send an `Access-Control-Allow-Origin` header that allows your app's origin.
- An HTTPS page cannot load HTTP assets. Check that your Content Security Policy allows the request, and allows WebAssembly, because SparkJS uses it.
- Check the file extension. The format is detected from the file name or bytes, so a URL without an extension is safest served with the right content type.

### File size shows as unknown

The size comes from a `HEAD` request's `Content-Length`, falling back to the browser's resource timing data. Cross-origin servers that do not expose `Content-Length` (`Access-Control-Expose-Headers`) show no size. Local files always show their size.

### The splat is upside down or mirrored

Set `flipY={false}`. Splat tools use different axis conventions.

### The splat looks off-centre or cropped

Check that the parent element has an explicit height and is not clipped by an ancestor with `overflow: hidden`. The viewer resizes with its container, so a parent that changes size is handled automatically.

### Blank viewer, context loss or poor performance

- Give the viewer's parent a non-zero width and height. Check the Console for WebGL errors, and check hardware acceleration and drivers.
- Large splats need a lot of GPU memory. Use compressed formats (`.spz`), a lower SH band setting, or paged `.rad` streaming for very large scenes.
- Each viewer creates a WebGL context. Avoid mounting many at once and unmount the ones you no longer need.
- If the context is lost, the viewer shows a message with a reload button.

---

## Keyboard shortcuts and mouse controls

| Input | Action |
| --- | --- |
| Left drag | Orbit |
| Right drag, or two-finger drag | Pan |
| Scroll, or pinch | Zoom |
| `F` | Reset to the isometric fit view |
| `G` | Toggle the grid |
| `B` | Toggle the bounding box |
| `R` | Toggle turntable rotation |
| `I` | Toggle the telemetry drawer |
| `[` / `]` | Previous / next viewpoint |
| `Esc` | Close the telemetry drawer |

Shortcuts are ignored while a text field or dropdown has focus, or while the paradata dialog is open.

---

## Citation and credits

The demo splat is a scan of a colossal foot by Daniel Pett. The viewer uses [SparkJS](https://sparkjs.dev/) for splat rendering and [Three.js](https://threejs.org/) for the scene, camera and controls.

---

## License

MIT. See [LICENSE.md](./LICENSE.md).
