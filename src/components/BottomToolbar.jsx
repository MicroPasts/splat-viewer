const CAMERA_VIEWS = [
    { id: 'iso', label: 'Iso' },
    { id: 'front', label: 'Front' },
    { id: 'top', label: 'Top' },
    { id: 'side', label: 'Side' },
];

const BG_SWATCHES = [
    { name: 'Dark Slate', hex: '#090d16' },
    { name: 'Obsidian', hex: '#020617' },
    { name: 'Light Slate', hex: '#f1f5f9' },
    { name: 'Warm Stone', hex: '#e7e5e4' },
];

export default function BottomToolbar({
    splatCount = 0,
    paged = false,
    showGrid,
    setShowGrid,
    showBounds,
    setShowBounds,
    autoRotate,
    setAutoRotate,
    opacity,
    setOpacity,
    maxSh,
    setMaxSh,
    bgColor,
    setBgColor,
    setCameraView,
}) {
    const pillWellClass =
        'flex items-center gap-1 bg-slate-100/80 border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800/60 p-1 rounded-xl border';

    const toggleBtnClass = (active) =>
        `px-2 py-1 rounded-lg font-medium border transition ${
            active
                ? 'bg-amber-500/20 text-amber-800 border-amber-500/50 dark:text-amber-300 dark:border-amber-500/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60'
        }`;

    return (
        <nav
            aria-label="Gaussian splat camera and rendering controls"
            className="pointer-events-auto max-w-6xl w-full mx-auto bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/90 dark:text-slate-300 dark:border-slate-800/80 backdrop-blur-xl border rounded-xl px-3 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs"
        >
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <span>{splatCount.toLocaleString()} splats</span>
                {paged && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[10px] uppercase">
                        Paged LoD
                    </span>
                )}
            </div>

            <div role="group" aria-label="Viewport helpers" className="flex items-center gap-1">
                <button
                    type="button"
                    aria-pressed={showGrid}
                    onClick={() => setShowGrid((prev) => !prev)}
                    title="Toggle Reference Grid (G)"
                    className={toggleBtnClass(showGrid)}
                >
                    Grid
                </button>
                <button
                    type="button"
                    aria-pressed={showBounds}
                    onClick={() => setShowBounds((prev) => !prev)}
                    title="Toggle Bounding Box (B)"
                    className={toggleBtnClass(showBounds)}
                >
                    Bounds
                </button>
                <button
                    type="button"
                    aria-pressed={autoRotate}
                    onClick={() => setAutoRotate((prev) => !prev)}
                    title="Toggle Auto-Rotate (R)"
                    className={toggleBtnClass(autoRotate)}
                >
                    Rotate
                </button>
            </div>

            <div role="group" aria-label="Camera preset angles" className={pillWellClass}>
                {CAMERA_VIEWS.map((view) => (
                    <button
                        type="button"
                        key={view.id}
                        onClick={() => setCameraView(view.id)}
                        className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        {view.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2.5 bg-slate-100/80 border-slate-200/80 dark:bg-slate-950/60 dark:border-slate-800/60 px-2.5 py-1.5 rounded-xl border">
                <label className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Opacity</span>
                    <input
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-14 accent-amber-500 cursor-pointer h-1 bg-slate-300 dark:bg-slate-800 rounded"
                    />
                </label>

                <label className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">SH</span>
                    <select
                        aria-label="Spherical harmonics bands"
                        value={maxSh}
                        onChange={(e) => setMaxSh(Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-mono text-[10px]"
                    >
                        <option value={0}>0</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                    </select>
                </label>

                <div role="group" aria-label="Background color" className="flex items-center gap-1">
                    {BG_SWATCHES.map((swatch) => (
                        <button
                            type="button"
                            key={swatch.hex}
                            aria-label={`Background ${swatch.name}`}
                            aria-pressed={bgColor === swatch.hex}
                            onClick={() => setBgColor(swatch.hex)}
                            style={{ backgroundColor: swatch.hex }}
                            className={`w-3.5 h-3.5 rounded-full border transition ${
                                bgColor === swatch.hex
                                    ? 'border-amber-500 scale-110'
                                    : 'border-slate-400 dark:border-slate-600'
                            }`}
                        />
                    ))}
                    <input
                        type="color"
                        aria-label="Custom background color"
                        title="Custom background color"
                        value={/^#[0-9a-f]{6}$/i.test(bgColor) ? bgColor : '#090d16'}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-4 h-4 p-0 rounded-full border border-slate-400 dark:border-slate-600 bg-transparent cursor-pointer"
                    />
                </div>
            </div>
        </nav>
    );
}