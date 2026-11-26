export default function ViewpointBar({
    viewpoints = [],
    activeIndex = -1,
    onSelectViewpoint,
    onStepViewpoint,
}) {
    if (!Array.isArray(viewpoints) || viewpoints.length === 0) return null;

    const current = activeIndex >= 0 ? viewpoints[activeIndex] : null;

    return (
        <div
            role="region"
            aria-label="Curated camera viewpoints and tour stops"
            className="pointer-events-auto max-w-xl w-full mx-auto bg-white/90 text-slate-800 border-slate-200/90 dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-800/80 backdrop-blur-xl border rounded-full px-2.5 py-1.5 shadow-2xl flex items-center justify-between gap-2 text-xs"
        >
            <button
                type="button"
                aria-label="Previous viewpoint"
                onClick={() => onStepViewpoint(-1)}
                className="p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0"
            >
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <div className="min-w-0 flex-1 flex flex-col items-center text-center px-1">
                <div className="flex items-center gap-1.5 max-w-full">
                    <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        {current ? `${activeIndex + 1}/${viewpoints.length}` : `0/${viewpoints.length}`}
                    </span>
                    <span className="font-medium truncate">
                        {current ? current.title || `Viewpoint ${activeIndex + 1}` : `Viewpoints (${viewpoints.length})`}
                    </span>
                </div>
                {current?.description && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                        {current.description}
                    </p>
                )}
            </div>

            {viewpoints.length <= 8 && (
                <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {viewpoints.map((vp, idx) => (
                        <button
                            key={vp.id ?? idx}
                            type="button"
                            aria-label={`Go to viewpoint ${idx + 1}: ${vp.title || `Stop ${idx + 1}`}`}
                            aria-pressed={activeIndex === idx}
                            onClick={() => onSelectViewpoint(idx)}
                            className={`w-5 h-5 rounded-full font-mono text-[10px] font-bold transition ${
                                activeIndex === idx
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            )}

            <button
                type="button"
                aria-label="Next viewpoint"
                onClick={() => onStepViewpoint(1)}
                className="p-1.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 transition shrink-0"
            >
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}