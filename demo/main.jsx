import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import paradata from './paradata.json';

const SplatViewer = lazy(() => import('../src/index.js'));

const DEMO_SPLAT = {
    splatUrl: `${import.meta.env.BASE_URL}splats/colossal-foot.spz`,
    title: 'Colossal Foot',
    subtitle: 'Compressed SPZ Gaussian Splat',
    badge: 'SPZ',
};

function DemoApp() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Suspense fallback={null}>
                <SplatViewer
                    splatUrl={DEMO_SPLAT.splatUrl}
                    title={DEMO_SPLAT.title}
                    subtitle={DEMO_SPLAT.subtitle}
                    badge={DEMO_SPLAT.badge}
                    paradata={paradata}
                    initialTheme="light"
                />
            </Suspense>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <DemoApp />
    </React.StrictMode>
);