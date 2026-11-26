import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
    const isDocsBuild = command === 'build' && mode === 'docs';
    const isLibBuild = command === 'build' && !isDocsBuild;

    return {
        plugins: [react(), tailwindcss()],
        publicDir: isLibBuild ? false : 'demo/public',
        base: isDocsBuild ? './' : '/',
        build: isDocsBuild
            ? {
                  outDir: 'docs',
                  emptyOutDir: true,
                  // @sparkjsdev/spark embeds its WASM and is ~2.9 MB on its own; it is isolated in a lazy, cacheable chunk.
                  chunkSizeWarningLimit: 3000,
                  rollupOptions: {
                      output: {
                          manualChunks(id) {
                              if (id.includes('node_modules/@sparkjsdev/spark')) return 'spark';
                              if (id.includes('node_modules/three')) return 'three';
                              if (id.includes('node_modules/react')) return 'react';
                          },
                      },
                  },
              }
            : isLibBuild
              ? {
                    outDir: 'dist',
                    emptyOutDir: true,
                    lib: {
                        entry: resolve(__dirname, 'src/index.js'),
                        name: 'SplatViewer',
                        fileName: (format) =>
                            format === 'es'
                                ? 'splat-viewer.js'
                                : 'splat-viewer.umd.cjs',
                    },
                    rollupOptions: {
                        external: ['react', 'react-dom', 'react/jsx-runtime', 'three', '@sparkjsdev/spark'],
                        output: {
                            exports: 'named',
                            globals: {
                                react: 'React',
                                'react-dom': 'ReactDOM',
                                'react/jsx-runtime': 'jsxRuntime',
                                '@sparkjsdev/spark': 'Spark',
                                three: 'THREE',
                            },
                            assetFileNames: (assetInfo) =>
                                assetInfo.name === 'style.css'
                                    ? 'styles.css'
                                    : assetInfo.name,
                        },
                    },
                }
              : undefined,
    };
});