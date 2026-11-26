import { formatBytes } from '../utils/splatHelpers.js';

const MM_PER_UNIT = { mm: 1, cm: 10, in: 25.4 };

function formatLength(sceneUnits, mmPerUnit, measureUnit) {
    if (!(mmPerUnit > 0)) return `${sceneUnits.toFixed(3)} u`;
    const mm = sceneUnits * mmPerUnit;
    if (measureUnit === 'in') return `${(mm / 25.4).toFixed(2)} in`;
    if (measureUnit === 'cm') return `${(mm / 10).toFixed(2)} cm`;
    return mm >= 1000 ? `${(mm / 1000).toFixed(3)} m` : `${mm.toFixed(1)} mm`;
}

function Row({ label, children }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-slate-500 shrink-0">{label}</dt>
            <dd className="font-mono text-slate-900 dark:text-slate-200 text-right truncate">{children}</dd>
        </div>
    );
}

function Shortcut({ keys, children }) {
    return (
        <div>
            <kbd className="px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent rounded font-mono">
                {keys}
            </kbd>{' '}
            {children}
        </div>
    );
}

export default function TelemetryDrawer({
    isOpen,
    onClose,
    stats,
    fileBytes,
    mmPerUnit,
    measureUnit = 'mm',
    fileName,
    splatUrl,
    opacity,
    maxSh,
}) {
    if (!isOpen) return null;

    const scaled = mmPerUnit > 0;
    const size = stats?.size;
    const hasBounds = Boolean(size) && size.x + size.y + size.z > 0;
    const format = (splatUrl || '').split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1];
    const volume = hasBounds ? size.x * size.y * size.z : 0;
    const density = volume > 0 && stats?.splatCount ? stats.splatCount / volume : 0;
    const unitsPerMeasure = scaled ? mmPerUnit / (MM_PER_UNIT[measureUnit] || 1) : 1;
    const densityPerMeasure = density / unitsPerMeasure ** 3;

    return (
        <aside
            aria-label="Splat telemetry"
            className="absolute top-28 sm:top-16 right-3 sm:right-4 z-30 w-80 max-w-[calc(100vw-1.5rem)] bg-white/95 text-slate-700 border-slate-200/90 dark:bg-slate-900/95 dark:text-slate-300 dark:border-slate-800/90 backdrop-blur-xl border rounded-2xl p-4 shadow-2xl space-y-4"
        >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Splat Telemetry
                </h2>
                <button
                    type="button"
                    aria-label="Close telemetry drawer"
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 text-sm p-1"
                >
                    <span aria-hidden="true">✕</span>
                </button>
            </div>

            <dl className="space-y-2 text-xs">
                <Row label="Splats">{(stats?.splatCount ?? 0).toLocaleString()}</Row>
                <Row label="Streaming">{stats?.paged ? 'Paged LoD' : 'Fully loaded'}</Row>
                {format && <Row label="Format">.{format.toLowerCase()}</Row>}
                {fileName && <Row label="Source File">{fileName}</Row>}
                {formatBytes(fileBytes) && <Row label="File Size">{formatBytes(fileBytes)}</Row>}
                <Row label="Scale Status">{scaled ? 'Calibrated' : 'Unscaled (scene units)'}</Row>
                {hasBounds && (
                    <>
                        <Row label="Width (X)">{formatLength(size.x, mmPerUnit, measureUnit)}</Row>
                        <Row label="Height (Y)">{formatLength(size.y, mmPerUnit, measureUnit)}</Row>
                        <Row label="Depth (Z)">{formatLength(size.z, mmPerUnit, measureUnit)}</Row>
                    </>
                )}
                {density > 0 && (
                    <Row label="Density">
                        {Math.round(densityPerMeasure).toLocaleString()} / {scaled ? `${measureUnit}³` : 'u³'}
                    </Row>
                )}
                <Row label="SH Bands">{maxSh}</Row>
                <Row label="Opacity">{Math.round(opacity * 100)}%</Row>
            </dl>

            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 grid grid-cols-2 gap-1.5">
                <Shortcut keys="F">Iso View</Shortcut>
                <Shortcut keys="G">Grid</Shortcut>
                <Shortcut keys="B">Bounds</Shortcut>
                <Shortcut keys="R">Rotate</Shortcut>
                <Shortcut keys="[ / ]">Viewpoints</Shortcut>
                <Shortcut keys="I">Telemetry</Shortcut>
            </div>
        </aside>
    );
}
