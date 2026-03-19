// Vite configuration for Lorewright.
// base: './' is critical for GitHub Pages subdirectory deployment —
// without it, built asset paths are absolute and break when served from /repo-name/.
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
