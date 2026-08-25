import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  },
  plugins: [
    {
      name: 'copy-extension-files',
      closeBundle() {
        // 复制 index.html 为 dashboard.html
        const indexHtml = join(process.cwd(), 'dist', 'index.html');
        if (existsSync(indexHtml)) {
          copyFileSync(indexHtml, join(process.cwd(), 'dist', 'dashboard.html'));
        }

        // 复制扩展和PWA相关文件到dist
        const extFiles = [
          'public/manifest.json',
          'public/background.js',
          'public/popup.html',
          'public/popup.js',
          'public/install.html',
          'public/install.js',
          'public/sw.js',
          'public/site.webmanifest'
        ];
        const extDirs = ['public/content', 'public/icons'];

        extFiles.forEach(function(f) {
          const src = join(process.cwd(), f);
          const dest = join(process.cwd(), 'dist', f.replace('public/', ''));
          if (existsSync(src)) {
            mkdirSync(join(dest, '..'), { recursive: true });
            copyFileSync(src, dest);
          }
        });

        extDirs.forEach(function(dir) {
          const srcDir = join(process.cwd(), dir);
          if (existsSync(srcDir)) {
            const files = readdirSync(srcDir);
            files.forEach(function(f) {
              const src = join(srcDir, f);
              const dest = join(process.cwd(), 'dist', dir.replace('public/', ''), f);
              mkdirSync(join(dest, '..'), { recursive: true });
              copyFileSync(src, dest);
            });
          }
        });
      }
    }
  ]
});
