import { useRef, useCallback } from 'react';
import ThemeToggle from './ThemeToggle.jsx';

export default function TopBar({
    title,
    subtitle,
    badge,
    backUrl,
    paradata,
    paradataOpen,
    showParadata = true,
    enableDeepLink = true,
    enableExport = true,
    showThemeToggle = true,
    enableFullscreen = true,
    downloadMenuOpen,
    setDownloadMenuOpen,
    loading,
    error,
    isFullscreen,
    theme,
    onToggleTheme,
    onCopyShareLink,
    onDownloadOriginal,
    onScreenshot,
    enableLocalFiles = false,
    onOpenLocalFile,
    showTelemetry = true,
    telemetryOpen = false,
    onToggleTelemetry,
    onToggleParadata,
    onToggleFullscreen,
    children,
}) {
    const exportMenuRef = useRef(null);
    const exportButtonRef = useRef(null);
    const hasParadata = Boolean(paradata && showParadata);

    const closeExport = useCallback(() => {
        setDownloadMenuOpen?.(false);
    }, [setDownloadMenuOpen]);

    const pillBtnInactive =
        'bg-white/90 text-slate-700 border-slate-200/90 hover:bg-slate-100 dark:bg-slate-900/85 dark:text-slate-200 dark:border-slate-800/80 dark:hover:bg-slate-800';

    return (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 px-3 sm:px-4 flex flex-wrap items-start justify-between gap-2">
            <header className="pointer-events-auto flex items-center gap-3 bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/85 dark:text-slate-100 dark:border-slate-800/80 backdrop-blur-md border rounded-xl px-3.5 py-2 shadow-2xl max-w-full sm:max-w-md lg:max-w-lg">
                {backUrl && (
                    <a
                        href={backUrl}
                        aria-label="Go back"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 border dark:border-slate-700/70 transition shrink-0"
                    >
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </a>
                )}
                <div className="min-w-0">
                    <h1 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{title}</span>
                        {badge && (
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 border dark:border-amber-500/20 shrink-0">
                                {badge}
                            </span>
                        )}
                    </h1>
                    {subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </header>

            <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end ml-auto">
                {enableLocalFiles && (
                    <button
                        type="button"
                        onClick={onOpenLocalFile}
                        aria-label="Open local splat file"
                        title="Open a local splat file (or drag and drop)"
                        className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${pillBtnInactive}`}
                    >
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                        <span className="hidden sm:inline">Open</span>
                    </button>
                )}

                {enableDeepLink && (
                    <button
                        type="button"
                        onClick={onCopyShareLink}
                        aria-label="Copy shareable link to current view"
                        title="Copy direct link to current camera angle"
                        className={`flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${pillBtnInactive}`}
                    >
                        <svg aria-hidden="true" className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </button>
                )}

                {enableExport && (
                    <div
                        ref={exportMenuRef}
                        className="relative"
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && downloadMenuOpen) {
                                e.stopPropagation();
                                closeExport();
                                exportButtonRef.current?.focus();
                            }
                        }}
                    >
                        <button
                            ref={exportButtonRef}
                            type="button"
                            aria-expanded={Boolean(downloadMenuOpen)}
                            disabled={loading || Boolean(error)}
                            onClick={() => setDownloadMenuOpen?.((prev) => !prev)}
                            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border disabled:opacity-50 backdrop-blur-md transition-all shadow-xl ${pillBtnInactive}`}
                        >
                            <svg aria-hidden="true" className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export</span>
                        </button>

                        {downloadMenuOpen && (
                            <div
                                role="group"
                                aria-label="Export options"
                                className="absolute right-0 mt-2 w-56 bg-white/95 text-slate-800 border-slate-200 dark:bg-slate-900/95 dark:text-slate-200 dark:border-slate-800 backdrop-blur-xl border rounded-xl shadow-2xl py-1.5 z-30 text-xs"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeExport();
                                        onScreenshot?.();
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                                >
                                    <span>Viewport Snapshot</span>
                                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">.PNG</span>
                                </button>
                                {onDownloadOriginal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeExport();
                                            onDownloadOriginal();
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                                    >
                                        <span>Source Splat Asset</span>
                                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">RAW</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {hasParadata && (
                    <button
                        type="button"
                        aria-pressed={paradataOpen}
                        aria-expanded={paradataOpen}
                        onClick={onToggleParadata}
                        className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${
                            paradataOpen
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                                : pillBtnInactive
                        }`}
                    >
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="hidden sm:inline">Paradata</span>
                    </button>
                )}

                {showTelemetry && (
                    <button
                        type="button"
                        aria-pressed={telemetryOpen}
                        aria-expanded={telemetryOpen}
                        aria-label="Toggle splat telemetry"
                        title="Splat telemetry (I)"
                        onClick={onToggleTelemetry}
                        className={`flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${
                            telemetryOpen
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                                : pillBtnInactive
                        }`}
                    >
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}

                {children}

                {showThemeToggle && (
                    <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
                )}

                {enableFullscreen && (
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        className={`flex items-center justify-center p-2 text-xs font-medium rounded-xl border backdrop-blur-md transition-all shadow-xl ${pillBtnInactive}`}
                    >
                        {isFullscreen ? (
                            <svg aria-hidden="true" className="w-4 h-4 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9L4 4m0 0l5 0m-5 0l0 5m6 6l5 5m0 0l-5 0m5 0l0-5M15 9l5-5m0 0l-5 0m5 0l0 5m-6 6l-5 5m0 0l5 0m-5 0l0-5" />
                            </svg>
                        ) : (
                            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}