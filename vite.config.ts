import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function syncStaticAssetsPlugin() {
  return {
    name: 'sync-static-assets',
    buildStart() {
      try {
        fs.cpSync(path.resolve(__dirname, 'js'), path.resolve(__dirname, 'public/js'), { recursive: true });
        fs.cpSync(path.resolve(__dirname, 'css'), path.resolve(__dirname, 'public/css'), { recursive: true });
      } catch (e) {
        console.warn('Sync to public warning:', e);
      }
    },
    closeBundle() {
      try {
        fs.cpSync(path.resolve(__dirname, 'js'), path.resolve(__dirname, 'dist/js'), { recursive: true });
        fs.cpSync(path.resolve(__dirname, 'css'), path.resolve(__dirname, 'dist/css'), { recursive: true });
      } catch (e) {
        console.warn('Sync to dist warning:', e);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), syncStaticAssetsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          register: path.resolve(__dirname, 'register.html'),
          dashboard: path.resolve(__dirname, 'dashboard.html'),
          report: path.resolve(__dirname, 'report.html'),
          reports: path.resolve(__dirname, 'reports.html'),
          myReports: path.resolve(__dirname, 'my-reports.html'),
          reportDetails: path.resolve(__dirname, 'report-details.html'),
          setupGuide: path.resolve(__dirname, 'setup-guide.html'),
          adminDashboard: path.resolve(__dirname, 'admin/dashboard.html'),
          adminReports: path.resolve(__dirname, 'admin/reports.html'),
          adminDepartments: path.resolve(__dirname, 'admin/departments.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

