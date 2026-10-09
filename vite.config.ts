import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built site work from any sub-folder or static host.
export default defineConfig({
  base: './',
  plugins: [react()],
});
