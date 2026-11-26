import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';

export function createSparkRenderer(renderer, options = {}) {
    return new SparkRenderer({
        renderer,
        ...options,
    });
}

/**
 * Loads a Gaussian splat asset (.ply, .spz, .splat, .ksplat, .sog, .rad)
 * into a container group and returns stats + a deterministic dispose function.
 */
export async function loadSplatAsset({
    url,
    file = null,
    parentGroup,
    paged,
    maxSh = 3,
    opacity = 1,
    flipY = true,
    isCancelled = () => false,
}) {
    // Local files are loaded from bytes; paged streaming needs a URL.
    const usePaged = file ? false : typeof paged === 'boolean' ? paged : /\.rad(\?|$)/i.test(url);
    const splatMesh = new SplatMesh(
        file
            ? { fileBytes: await file.arrayBuffer(), fileName: file.name }
            : { url, paged: usePaged }
    );

    if (flipY) {
        // Common orientation adjustment for captured splat coordinates in Three.js
        splatMesh.quaternion.set(1, 0, 0, 0);
    }
    splatMesh.opacity = opacity;
    if (typeof splatMesh.maxSh === 'number') {
        splatMesh.maxSh = maxSh;
    }

    parentGroup.add(splatMesh);

    if (splatMesh.initialized && typeof splatMesh.initialized.then === 'function') {
        await splatMesh.initialized;
    }

    if (isCancelled()) {
        parentGroup.remove(splatMesh);
        if (typeof splatMesh.dispose === 'function') {
            splatMesh.dispose();
        }
        return null;
    }

    const box = new THREE.Box3();
    if (typeof splatMesh.getBoundingBox === 'function') {
        try {
            const b = splatMesh.getBoundingBox(false);
            if (b && !b.isEmpty()) {
                splatMesh.updateWorldMatrix(true, false);
                box.copy(b).applyMatrix4(splatMesh.matrixWorld);
            }
        } catch {
            // Fallback below if bounding box isn't available yet
        }
    }
    if (box.isEmpty()) {
        box.setFromObject(splatMesh);
    }

    // Raw bounds include stray floaters and splat radii, which skews framing off-centre.
    // Prefer percentile bounds of visible splat centres.
    if (!usePaged && typeof splatMesh.forEachSplat === 'function' && splatMesh.numSplats > 0) {
        try {
            const maxSamples = 200000;
            const stride = Math.max(1, Math.floor(splatMesh.numSplats / maxSamples));
            const xs = [];
            const ys = [];
            const zs = [];
            splatMesh.forEachSplat((index, c, _s, _q, alpha) => {
                if (index % stride !== 0 || alpha < 0.3) return;
                xs.push(c.x);
                ys.push(c.y);
                zs.push(c.z);
            });
            if (xs.length > 100) {
                const pct = (arr, p) => {
                    const sorted = Float32Array.from(arr).sort();
                    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
                };
                const lo = 0.05;
                const hi = 0.95;
                const robust = new THREE.Box3(
                    new THREE.Vector3(pct(xs, lo), pct(ys, lo), pct(zs, lo)),
                    new THREE.Vector3(pct(xs, hi), pct(ys, hi), pct(zs, hi))
                );
                splatMesh.updateWorldMatrix(true, false);
                robust.applyMatrix4(splatMesh.matrixWorld);
                if (!robust.isEmpty()) box.copy(robust);
            }
        } catch {
            // Keep the raw bounds
        }
    }

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    if (!box.isEmpty()) {
        box.getSize(size);
        box.getCenter(center);
    }

    const stats = {
        splatCount: typeof splatMesh.numSplats === 'number' ? splatMesh.numSplats : 0,
        paged: usePaged,
        box,
        center,
        size,
    };

    const dispose = () => {
        parentGroup.remove(splatMesh);
        if (typeof splatMesh.dispose === 'function') {
            splatMesh.dispose();
        }
    };

    return { splatMesh, stats, dispose };
}