import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Required for GitHub Pages deployment under a sub-path
  base: '/AI_Fake_Image_Detector/',

  test: {
  environment: 'jsdom',
  globals: true,
  environmentOptions: {
    jsdom: {
      resources: 'usable',
    },
  },
},
});
