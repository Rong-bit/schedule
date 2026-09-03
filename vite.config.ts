import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type {Connect, Plugin} from 'vite';
import {defineConfig} from 'vite';

/**
 * 代理讀取 Google Calendar 公開 ICS，避免瀏覽器 CORS 擋住同步。
 * 僅允許已知的中正高工／台灣假日 calendar id。
 */
function googleCalendarIcsProxy(): Plugin {
  const ALLOWED = new Set([
    'ccvsns@mail2.ccvs.kh.edu.tw',
    'c_4a1579e6b8a1be92e94860760708e3631fd34d52d00d3957cb7d98cef9a24746@group.calendar.google.com',
    'c_4b0794ed20d29e2cb3410db729c92d0586d14f65edad8bbb836cf70fe3f5ce87@group.calendar.google.com',
    'c_f06f440a94a1f0a78bbeab3dd77efeb0805f94dd2039c7b96f95f380a2e66760@group.calendar.google.com',
    'c_4fae35905a29d8bca686782f5256522057dbb209a95f92e9ba98dbaa6a431f6f@group.calendar.google.com',
    'c_0afe1e3de281b51bd789648392e993823f9de235f07cff46e8b1a400bb325595@group.calendar.google.com',
    'c_5d2672b305cc8c13db60a51eef993242c339a644f0658e9ba4593d02d8c1f182@group.calendar.google.com',
    'c_50de6315be25d2b1e1759ddc3812f56f8101dbf23fb869d70892b6ff20cdf7ce@group.calendar.google.com',
    'c_07447754c22a8976cc38828363923c320226304433de41658ccc899cd45601bc@group.calendar.google.com',
    'zh-tw.taiwan#holiday@group.v.calendar.google.com',
  ]);

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    try {
      const rawUrl = req.url || '';
      if (!rawUrl.startsWith('/api/gcal-ics')) {
        next();
        return;
      }

      const url = new URL(rawUrl, 'http://localhost');
      const id = url.searchParams.get('id') || '';
      if (!id || !ALLOWED.has(id)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('不支援的日曆來源');
        return;
      }

      const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;
      const upstream = await fetch(icsUrl, {
        headers: {Accept: 'text/calendar'},
      });

      const body = await upstream.text();
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(body);
    } catch (err) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(err instanceof Error ? err.message : '日曆代理失敗');
    }
  };

  return {
    name: 'google-calendar-ics-proxy',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), googleCalendarIcsProxy()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
