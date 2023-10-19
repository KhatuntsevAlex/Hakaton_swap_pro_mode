import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
// @ts-ignore
import path from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            fileName: 'index',
            formats: ['es'],
            name: '@app/framework',
        },
        outDir: './dist',
        rollupOptions: {
            // Externalize deps that shouldn't be bundled
            external: ['react', 'react-dom', 'react-router-dom'],
            output: {
                // Global vars to use in UMD build for externalized deps
                globals: {
                    react: 'React',
                    process: '{}',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
    define: {}, // todo: add defines
    esbuild: {
        jsxInject: 'import React from \'react\'',
    },
    plugins: [dts()],
});
