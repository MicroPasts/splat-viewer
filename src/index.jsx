import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createSparkRenderer, loadSplatAsset } from './adapters/sparkAdapter.js';
import {
    triggerBlobDownload,
    disposeHelperObject,
    buildSplatHelpers,
    encodeViewHash,
    decodeViewHash,
    loadStoredBackground,
    storeBackground,
} from './utils/splatHelpers.js';
import TopBar from './components/TopBar.jsx';
import BottomToolbar from './components/BottomToolbar.jsx';
import ViewpointBar from './components/ViewpointBar.jsx';
import ParadataDrawer from './components/ParadataDrawer.jsx';
import TelemetryDrawer from './components/TelemetryDrawer.jsx';
import ScaleBarOverlay from './components/ScaleBarOverlay.jsx';
import { scaleNeedsUpdate } from './utils/scaleBar.js';

export default function SplatViewer({
    splatUrl,
    fileName = 'splat',
    title = 'Gaussian Splat',
    subtitle = '',
    badge = 'SPLAT',
    backUrl = null,
    paged = undefined,
    flipY = true,
    viewpoints = [],
    enableDeepLink = true,
    enableExport = true,
    paradata = null,
    showParadata = true,
    showThemeToggle = true,
    enableFullscreen = true,
    initialTheme = 'dark',
    initialBackground = '#090d16',
    persistBackground = true,
    mmPerUnit = null,
    measureUnit = 'mm',
    showScaleBar = true,
    showTelemetry = true,
    enableLocalFiles = true,
    onLoad = null,
    onError = null,
    children = null,
}) {
    const wrapperRef = useRef(null);
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const splatGroupRef = useRef(new THREE.Group());
    const splatMeshRef = useRef(null);
    const gridRef = useRef(null);
    const bboxRef = useRef(null);
    const cameraTweenRef = useRef(null);
    const toastTimerRef = useRef(null);
    const boundsRef = useRef({ center: new THREE.Vector3(), size: new THREE.Vector3(1, 1, 1) });

    const callbacksRef = useRef({ onLoad, onError, enableDeepLink });
    callbacksRef.current = { onLoad, onError, enableDeepLink };

    const [theme, setTheme] = useState(initialTheme);
    const [bgColor, setBgColor] = useState(
        () =>
            (persistBackground ? loadStoredBackground() : null) ||
            (initialTheme === 'light' && initialBackground === '#090d16' ? '#f1f5f9' : initialBackground)
    );
    const [showGrid, setShowGrid] = useState(false);
    const [showBounds, setShowBounds] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);
    const [opacity, setOpacity] = useState(1);
    const [maxSh, setMaxSh] = useState(3);
    const [activeViewpointIdx, setActiveViewpointIdx] = useState(-1);
    const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [localFile, setLocalFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const [fileBytes, setFileBytes] = useState(null);
    const [paradataOpen, setParadataOpen] = useState(false);
    const [telemetryOpen, setTelemetryOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contextLost, setContextLost] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const [splatStats, setSplatStats] = useState({ splatCount: 0, paged: false, size: null });

    const [pixelsPerMm, setPixelsPerMm] = useState(0);
    const pixelsPerMmRef = useRef(0);
    const mmPerUnitRef = useRef(mmPerUnit);
    mmPerUnitRef.current = mmPerUnit;

    const renderOptionsRef = useRef({ opacity, maxSh, showGrid, showBounds });
    renderOptionsRef.current = { opacity, maxSh, showGrid, showBounds };

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToastMessage((prev) => (prev === msg ? null : prev));
        }, 2600);
    }, []);

    useEffect(() => {
        setFileBytes(null);
        if (localFile) {
            setFileBytes(localFile.size);
            return;
        }
        if (!splatUrl) return;
        const controller = new AbortController();
        fetch(splatUrl, { method: 'HEAD', signal: controller.signal })
            .then((res) => {
                const length = Number(res.headers.get('content-length'));
                if (res.ok && length > 0) setFileBytes(length);
            })
            .catch(() => {});
        return () => controller.abort();
    }, [splatUrl, localFile]);

    // Fallback when HEAD is blocked or lacks Content-Length (e.g. CORS): use resource timing.
    useEffect(() => {
        if (loading || fileBytes || !splatUrl || localFile) return;
        try {
            const href = new URL(splatUrl, window.location.href).href;
            const entry = performance.getEntriesByName(href).pop();
            const bytes = entry?.decodedBodySize || entry?.encodedBodySize || 0;
            if (bytes > 0) setFileBytes(bytes);
        } catch {
            // Resource timing unavailable
        }
    }, [loading, fileBytes, splatUrl, localFile]);

    const openLocalFile = useCallback((file) => {
        if (!file) return;
        setLocalFile(file);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    const handleToggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            setBgColor((currentBg) => {
                if (next === 'light' && currentBg === '#090d16') return '#f1f5f9';
                if (next === 'dark' && currentBg === '#f1f5f9') return '#090d16';
                return currentBg;
            });
            return next;
        });
    }, []);

    const setCameraView = useCallback((preset = 'iso') => {
        const cam = cameraRef.current;
        const controls = controlsRef.current;
        if (!cam || !controls) return;

        cameraTweenRef.current = null;
        setActiveViewpointIdx(-1);

        const { center, size } = boundsRef.current;
        const maxDim = Math.max(size.x, size.y, size.z, 0.1);
        const fovRad = THREE.MathUtils.degToRad(cam.fov);
        const dist = Math.abs(maxDim / 2 / Math.tan(fovRad / 2)) * 1.45;

        const pos = center.clone();
        switch (preset) {
            case 'front':
                pos.z += dist;
                break;
            case 'top':
                pos.y += dist;
                pos.z += 0.001;
                break;
            case 'side':
                pos.x += dist;
                break;
            case 'iso':
            default:
                pos.set(center.x + dist * 0.45, center.y + dist * 0.3, center.z + dist * 0.85);
                break;
        }

        cam.position.copy(pos);
        controls.target.copy(center);
        controls.update();
    }, []);

    const handleSelectViewpoint = useCallback(
        (idx) => {
            if (!Array.isArray(viewpoints) || !viewpoints[idx]) return;
            const cam = cameraRef.current;
            const controls = controlsRef.current;
            const vp = viewpoints[idx];
            setActiveViewpointIdx(idx);

            if (cam && controls && Array.isArray(vp.position) && vp.position.length === 3) {
                const targetVec =
                    Array.isArray(vp.target) && vp.target.length === 3
                        ? new THREE.Vector3(...vp.target)
                        : controls.target.clone();
                cameraTweenRef.current = {
                    targetPos: new THREE.Vector3(...vp.position),
                    targetLook: targetVec,
                    alpha: 0,
                };
            }
        },
        [viewpoints]
    );

    const handleStepViewpoint = useCallback(
        (delta) => {
            if (!Array.isArray(viewpoints) || viewpoints.length === 0) return;
            const nextIdx =
                activeViewpointIdx < 0
                    ? delta < 0
                        ? viewpoints.length - 1
                        : 0
                    : (activeViewpointIdx + delta + viewpoints.length) % viewpoints.length;
            handleSelectViewpoint(nextIdx);
        },
        [viewpoints, activeViewpointIdx, handleSelectViewpoint]
    );

    const handleCopyShareLink = useCallback(async () => {
        const cam = cameraRef.current;
        const controls = controlsRef.current;
        if (!cam || !controls) return;
        const encoded = encodeViewHash(cam, controls, { opacity, maxSh, bg: bgColor });
        const url = `${window.location.origin}${window.location.pathname}${window.location.search}#view=${encoded}`;
        window.history.replaceState(null, '', `#view=${encoded}`);
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard access is unavailable.');
            }
            await navigator.clipboard.writeText(url);
            showToast('View link copied');
        } catch (err) {
            console.error('Failed to copy view link:', err);
            showToast('Could not copy link; view link is in the address bar');
        }
    }, [opacity, maxSh, bgColor, showToast]);

    const handleScreenshot = useCallback(() => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const cam = cameraRef.current;
        if (!renderer || !scene || !cam || contextLost) return;
        renderer.render(scene, cam);
        renderer.domElement.toBlob((blob) => {
            if (!blob) return;
            const base = String(localFile?.name || fileName || 'splat').replace(/\.[^/.]+$/, '');
            triggerBlobDownload(blob, `${base}_splat.png`);
            showToast('Snapshot saved');
        });
    }, [fileName, localFile, contextLost, showToast]);

    const handleDownloadOriginal = useCallback(() => {
        if (!splatUrl || localFile) return;
        const a = document.createElement('a');
        a.href = splatUrl;
        const cleanFile = String(fileName || 'splat').split('/').pop() || 'splat.ply';
        a.download = cleanFile;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }, [splatUrl, localFile, fileName]);

    const toggleFullscreen = useCallback(() => {
        if (!wrapperRef.current) return;
        if (!document.fullscreenElement) {
            wrapperRef.current.requestFullscreen().catch((err) => console.error(err));
        } else {
            document.exitFullscreen().catch((err) => console.error(err));
        }
    }, []);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (paradataOpen) return;
            const tag = e.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.key === 'f' || e.key === 'F') setCameraView('iso');
            else if (e.key === 'g' || e.key === 'G') setShowGrid((p) => !p);
            else if (e.key === 'b' || e.key === 'B') setShowBounds((p) => !p);
            else if (e.key === 'r' || e.key === 'R') setAutoRotate((p) => !p);
            else if (e.key === 'i' || e.key === 'I') setTelemetryOpen((p) => !p);
            else if (e.key === 'Escape') setTelemetryOpen(false);
            else if (e.key === '[') handleStepViewpoint(-1);
            else if (e.key === ']') handleStepViewpoint(1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [paradataOpen, setCameraView, handleStepViewpoint]);

    useEffect(() => {
        const container = mountRef.current;
        const rootWrapper = wrapperRef.current || container;
        if (!container || !rootWrapper) return;

        container.innerHTML = '';
        const width = rootWrapper.clientWidth || 800;
        const height = rootWrapper.clientHeight || 600;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(bgColor);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 2000);
        camera.position.set(0, 0.6, 2.5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(width, height, false);
        rendererRef.current = renderer;
        // setSize(..., false) leaves CSS size untouched; without this the canvas overflows by the pixel ratio and renders off-centre.
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        const handleContextLost = (event) => {
            event.preventDefault();
            cameraTweenRef.current = null;
            setContextLost(true);
        };
        const handleContextRestored = () => {
            setContextLost(false);
            setReloadToken((t) => t + 1);
        };
        renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
        renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

        const spark = createSparkRenderer(renderer);
        scene.add(spark);
        scene.add(splatGroupRef.current);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controlsRef.current = controls;

        const cancelTweenOnInteract = () => {
            cameraTweenRef.current = null;
        };
        controls.addEventListener('start', cancelTweenOnInteract);

        let isCancelled = false;
        let currentAssetDispose = null;

        setLoading(true);
        setError(null);
        setContextLost(false);
        setActiveViewpointIdx(-1);
        setParadataOpen(false);
        setDownloadMenuOpen(false);
        cameraTweenRef.current = null;

        const hasSource = Boolean(splatUrl || localFile);
        if (!hasSource) setLoading(false);

        const loadPromise = hasSource
            ? loadSplatAsset({
                  url: splatUrl,
                  file: localFile,
                  parentGroup: splatGroupRef.current,
                  paged,
                  maxSh,
                  opacity,
                  flipY,
                  isCancelled: () => isCancelled,
              })
            : Promise.resolve(null);

        loadPromise
            .then((result) => {
                if (isCancelled || !result) return;
                currentAssetDispose = result.dispose;
                splatMeshRef.current = result.splatMesh;
                const currentRenderOptions = renderOptionsRef.current;
                result.splatMesh.opacity = currentRenderOptions.opacity;
                if (typeof result.splatMesh.maxSh === 'number') {
                    result.splatMesh.maxSh = currentRenderOptions.maxSh;
                }

                disposeHelperObject(gridRef.current);
                disposeHelperObject(bboxRef.current);
                if (gridRef.current) scene.remove(gridRef.current);
                if (bboxRef.current) scene.remove(bboxRef.current);

                if (!result.stats.box.isEmpty()) {
                    boundsRef.current = {
                        center: result.stats.center,
                        size: result.stats.size,
                    };
                    const { grid, bbox } = buildSplatHelpers({
                        center: result.stats.center,
                        size: result.stats.size,
                        minY: result.stats.box.min.y,
                    });
                    grid.visible = currentRenderOptions.showGrid;
                    bbox.visible = currentRenderOptions.showBounds;
                    scene.add(grid);
                    scene.add(bbox);
                    gridRef.current = grid;
                    bboxRef.current = bbox;
                }

                setSplatStats({
                    splatCount: result.stats.splatCount,
                    paged: result.stats.paged,
                    size: result.stats.size.clone(),
                });
                setLoading(false);

                if (callbacksRef.current.enableDeepLink) {
                    const decoded = decodeViewHash(window.location.hash);
                    if (decoded?.p && decoded?.t) {
                        camera.position.fromArray(decoded.p);
                        controls.target.fromArray(decoded.t);
                        controls.update();
                        if (typeof decoded.opacity === 'number') setOpacity(decoded.opacity);
                        if (typeof decoded.maxSh === 'number') setMaxSh(decoded.maxSh);
                        if (decoded.bg) setBgColor(decoded.bg);
                        callbacksRef.current.onLoad?.(result.stats);
                        return;
                    }
                }

                setCameraView('iso');
                callbacksRef.current.onLoad?.(result.stats);
            })
            .catch((err) => {
                if (isCancelled) return;
                console.error('Failed to load Gaussian splat asset:', err);
                setError('Failed to load Gaussian splat asset. Check file path, format, or CORS headers.');
                setLoading(false);
                callbacksRef.current.onError?.(err);
            });

        let rafId = 0;
        let lastScaleSync = 0;
        const animate = (now = 0) => {
            rafId = requestAnimationFrame(animate);

            if (now - lastScaleSync > 65) {
                lastScaleSync = now;
                const mmPerSceneUnit = mmPerUnitRef.current;
                const viewportHeight = rootWrapper.clientHeight;
                let nextPxPerMm = 0;
                if (mmPerSceneUnit > 0 && viewportHeight > 0) {
                    const dist = camera.position.distanceTo(controls.target);
                    const visibleHeightUnits =
                        2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
                    nextPxPerMm = viewportHeight / (visibleHeightUnits * mmPerSceneUnit);
                }
                if (nextPxPerMm === 0 ? pixelsPerMmRef.current !== 0 : scaleNeedsUpdate(pixelsPerMmRef.current, nextPxPerMm)) {
                    pixelsPerMmRef.current = nextPxPerMm;
                    setPixelsPerMm(nextPxPerMm);
                }
            }

            if (cameraTweenRef.current) {
                const tw = cameraTweenRef.current;
                tw.alpha = Math.min(tw.alpha + 0.08, 1);
                camera.position.lerp(tw.targetPos, tw.alpha);
                controls.target.lerp(tw.targetLook, tw.alpha);
                if (tw.alpha >= 1) cameraTweenRef.current = null;
            }

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const syncSize = () => {
            const w = rootWrapper.clientWidth;
            const h = rootWrapper.clientHeight;
            if (w > 0 && h > 0) {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h, false);
            }
        };

        const resizeObserver = new ResizeObserver(syncSize);
        resizeObserver.observe(rootWrapper);

        return () => {
            isCancelled = true;
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            controls.removeEventListener('start', cancelTweenOnInteract);
            controls.dispose();
            currentAssetDispose?.();
            disposeHelperObject(gridRef.current);
            disposeHelperObject(bboxRef.current);
            if (typeof spark.dispose === 'function') {
                spark.dispose();
            }
            renderer.domElement.removeEventListener('webglcontextlost', handleContextLost, false);
            renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored, false);
            if (renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
            renderer.dispose();
            renderer.forceContextLoss();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [splatUrl, localFile, paged, flipY, reloadToken, setCameraView]);

    useEffect(() => {
        if (gridRef.current) gridRef.current.visible = showGrid;
    }, [showGrid]);

    useEffect(() => {
        if (bboxRef.current) bboxRef.current.visible = showBounds;
    }, [showBounds]);

    useEffect(() => {
        if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
    }, [autoRotate]);

    useEffect(() => {
        if (splatMeshRef.current) splatMeshRef.current.opacity = opacity;
    }, [opacity]);

    useEffect(() => {
        if (splatMeshRef.current && typeof splatMeshRef.current.maxSh === 'number') {
            splatMeshRef.current.maxSh = maxSh;
        }
    }, [maxSh]);

    useEffect(() => {
        if (sceneRef.current) sceneRef.current.background = new THREE.Color(bgColor);
        if (persistBackground) storeBackground(bgColor);
    }, [bgColor, persistBackground]);

    return (
        <div
            ref={wrapperRef}
            onDragOver={
                enableLocalFiles
                    ? (e) => {
                          if (!e.dataTransfer?.types?.includes('Files')) return;
                          e.preventDefault();
                          setDragActive(true);
                      }
                    : undefined
            }
            onDragLeave={
                enableLocalFiles
                    ? (e) => {
                          if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
                      }
                    : undefined
            }
            onDrop={
                enableLocalFiles
                    ? (e) => {
                          if (!e.dataTransfer?.files?.length) return;
                          e.preventDefault();
                          setDragActive(false);
                          openLocalFile(e.dataTransfer.files[0]);
                      }
                    : undefined
            }
            className={`sv-root gmv-root relative w-full h-full font-sans select-none overflow-hidden bg-slate-100 dark:bg-slate-950 ${
                theme === 'dark' ? 'dark' : ''
            }`}
        >
            <div
                ref={mountRef}
                role="application"
                tabIndex={0}
                aria-label="Interactive 3D Gaussian splat viewport"
                className="w-full h-full focus:outline-hidden cursor-grab active:cursor-grabbing"
            />

            {enableLocalFiles && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ply,.spz,.splat,.ksplat,.sog,.zip"
                    aria-label="Open local splat file"
                    className="hidden"
                    onChange={(e) => {
                        openLocalFile(e.target.files?.[0]);
                        e.target.value = '';
                    }}
                />
            )}

            {dragActive && (
                <div className="pointer-events-none absolute inset-3 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-amber-500 bg-amber-500/10 text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Drop a splat file to open it
                </div>
            )}

            {!splatUrl && !localFile && !loading && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    {enableLocalFiles
                        ? 'Drop a .ply, .spz, .splat, .ksplat or .sog file here, or use the Open button.'
                        : 'No splat source provided.'}
                </div>
            )}

            {toastMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-white/95 border-amber-500/50 text-amber-700 dark:bg-slate-800/95 dark:border-amber-500/40 dark:text-amber-300 border text-xs font-medium shadow-2xl"
                >
                    {toastMessage}
                </div>
            )}

            {contextLost && (
                <div
                    role="alert"
                    className="absolute inset-0 z-40 flex items-center justify-center bg-slate-100/95 dark:bg-slate-950/95 p-6"
                >
                    <div className="max-w-md bg-white border-amber-500/40 dark:bg-slate-900 dark:border-amber-500/40 border rounded-2xl p-5 text-center shadow-2xl space-y-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            WebGL Graphics Context Lost
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            The browser GPU context was interrupted (often due to splat memory pressure or display sleep).
                        </p>
                        <button
                            type="button"
                            onClick={() => setReloadToken((t) => t + 1)}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition"
                        >
                            Reload Splat
                        </button>
                    </div>
                </div>
            )}

            {loading && !contextLost && (
                <div
                    role="status"
                    aria-live="polite"
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-sm"
                >
                    <div className="w-40 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
                        <div className="h-full w-1/2 bg-amber-500 animate-pulse" />
                    </div>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        Loading Gaussian Splat...
                    </p>
                </div>
            )}

            {error && !contextLost && (
                <div
                    role="alert"
                    className="absolute inset-0 z-40 flex items-center justify-center bg-slate-100/95 dark:bg-slate-950/95 p-6"
                >
                    <div className="max-w-md bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-500/40 border rounded-2xl p-5 text-center">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                            Splat Load Error
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-200/80">{error}</p>
                    </div>
                </div>
            )}

            <TopBar
                title={title}
                subtitle={subtitle}
                badge={badge}
                backUrl={backUrl}
                paradata={paradata}
                paradataOpen={paradataOpen}
                showParadata={showParadata}
                enableDeepLink={enableDeepLink}
                enableExport={enableExport}
                showThemeToggle={showThemeToggle}
                enableFullscreen={enableFullscreen}
                downloadMenuOpen={downloadMenuOpen}
                setDownloadMenuOpen={setDownloadMenuOpen}
                loading={loading}
                error={error}
                isFullscreen={isFullscreen}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                onCopyShareLink={handleCopyShareLink}
                onDownloadOriginal={splatUrl && !localFile ? handleDownloadOriginal : undefined}
                enableLocalFiles={enableLocalFiles}
                onOpenLocalFile={() => fileInputRef.current?.click()}
                onScreenshot={handleScreenshot}
                showTelemetry={showTelemetry}
                telemetryOpen={telemetryOpen}
                onToggleTelemetry={() => setTelemetryOpen((prev) => !prev)}
                onToggleParadata={() => setParadataOpen((prev) => !prev)}
                onToggleFullscreen={toggleFullscreen}
            >
                {children}
            </TopBar>

            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 px-3 sm:px-4 flex flex-col gap-2">
                <ViewpointBar
                    viewpoints={viewpoints}
                    activeIndex={activeViewpointIdx}
                    onSelectViewpoint={handleSelectViewpoint}
                    onStepViewpoint={handleStepViewpoint}
                />

                {showScaleBar && (
                    <div className="flex justify-start">
                        <ScaleBarOverlay
                            pixelsPerMm={pixelsPerMm}
                            isUnscaled={!(mmPerUnit > 0)}
                            measureUnit={measureUnit}
                        />
                    </div>
                )}

                <BottomToolbar
                    splatCount={splatStats.splatCount}
                    paged={splatStats.paged}
                    showGrid={showGrid}
                    setShowGrid={setShowGrid}
                    showBounds={showBounds}
                    setShowBounds={setShowBounds}
                    autoRotate={autoRotate}
                    setAutoRotate={setAutoRotate}
                    opacity={opacity}
                    setOpacity={setOpacity}
                    maxSh={maxSh}
                    setMaxSh={setMaxSh}
                    bgColor={bgColor}
                    setBgColor={setBgColor}
                    setCameraView={setCameraView}
                />
            </div>

            <TelemetryDrawer
                isOpen={telemetryOpen && showTelemetry}
                onClose={() => setTelemetryOpen(false)}
                stats={splatStats}
                fileBytes={fileBytes}
                mmPerUnit={mmPerUnit}
                measureUnit={measureUnit}
                fileName={localFile?.name || (fileName !== 'splat' ? fileName : null)}
                splatUrl={localFile ? localFile.name : splatUrl}
                opacity={opacity}
                maxSh={maxSh}
            />

            <ParadataDrawer
                isOpen={paradataOpen && Boolean(paradata) && showParadata}
                onClose={() => setParadataOpen(false)}
                paradata={paradata}
            />
        </div>
    );
}