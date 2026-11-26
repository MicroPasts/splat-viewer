import * as THREE from 'three';

export function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return null;
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function disposeHelperObject(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m?.dispose?.());
    } else if (obj.material) {
        obj.material.dispose?.();
    }
}

export function buildSplatHelpers({ center, size, minY }) {
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    const gridSize = Math.pow(10, Math.ceil(Math.log10(Math.max(maxDim * 2, 0.1))));

    const grid = new THREE.GridHelper(gridSize, 20, 0xf59e0b, 0x334155);
    grid.position.set(center.x, Number.isFinite(minY) ? minY : center.y - size.y * 0.5, center.z);
    grid.visible = false;

    const box = new THREE.Box3(
        center.clone().sub(size.clone().multiplyScalar(0.5)),
        center.clone().add(size.clone().multiplyScalar(0.5))
    );
    const bbox = new THREE.Box3Helper(box, 0xf59e0b);
    bbox.visible = false;

    return { grid, bbox };
}

export function encodeViewHash(camera, controls, extra = {}) {
    const payload = {
        p: camera.position.toArray().map((n) => Number(n.toFixed(4))),
        t: controls.target.toArray().map((n) => Number(n.toFixed(4))),
        ...extra,
    };
    return btoa(encodeURIComponent(JSON.stringify(payload)));
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value) {
    return typeof value === 'string' && HEX_COLOR.test(value);
}

const BG_STORAGE_KEY = 'splat-viewer:bgColor';

export function loadStoredBackground() {
    try {
        const stored = window.localStorage.getItem(BG_STORAGE_KEY);
        return isHexColor(stored) ? stored : null;
    } catch {
        return null;
    }
}

export function storeBackground(color) {
    try {
        window.localStorage.setItem(BG_STORAGE_KEY, color);
    } catch {
        // Storage can be unavailable (private mode, blocked cookies)
    }
}

export function decodeViewHash(hash = '') {
    const match = String(hash).match(/view=([A-Za-z0-9+/=]+)/);
    if (!match) return null;
    try {
        const payload = JSON.parse(decodeURIComponent(atob(match[1])));
        const isVector = (value) =>
            Array.isArray(value) &&
            value.length === 3 &&
            value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));

        if (!payload || !isVector(payload.p) || !isVector(payload.t)) return null;
        if (
            payload.opacity !== undefined &&
            (typeof payload.opacity !== 'number' ||
                !Number.isFinite(payload.opacity) ||
                payload.opacity < 0.05 ||
                payload.opacity > 1)
        ) {
            return null;
        }
        if (
            payload.maxSh !== undefined &&
            (!Number.isInteger(payload.maxSh) || payload.maxSh < 0 || payload.maxSh > 3)
        ) {
            return null;
        }

        if (payload.bg !== undefined && !isHexColor(payload.bg)) return null;

        return payload;
    } catch {
        return null;
    }
}