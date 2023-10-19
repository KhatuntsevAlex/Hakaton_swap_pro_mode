/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import viteCompression from 'vite-plugin-compression';
import path from 'path';
import generateFile from 'vite-plugin-generate-file';

// https://vitejs.dev/config/
export default ({ mode }) => {
    process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
    return defineConfig({
        plugins: [
            react(),
            viteTsconfigPaths(),
            viteCompression(),
            svgrPlugin(),
            generateFile({
                output: './version.json',
                type: 'json',
                data: { version: process.env.VITE_APP_VERSION },
            }),
            checker({ typescript: true }),
        ],
        resolve: {
            alias: {
                '@app/framework': path.resolve(__dirname, '../framework'),
                '@tacans/sentry-logger': path.resolve(__dirname, '../sentry-logger'),
                '@app/tv-chart': path.resolve(__dirname, '../tv-chart'),
            },
        },
        optimizeDeps: {
            disabled: false,
            esbuildOptions: {
                // Node.js global to browser globalThis
                define: {
                    global: 'globalThis',
                },
            },
        },
        build: {
            rollupOptions: {
                maxParallelFileOps: 9999,
            },
            commonjsOptions: {
                include: [],
            },
        },
        server: {
            port: 3002,
            open: true,
        },
    });
};
