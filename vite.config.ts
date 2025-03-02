import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: './',
    server: {
      open: true,
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
    define: {
      __APP_MODE__: JSON.stringify(env.VITE_START_MODE || 'editor'),
    },
  };
});