import { defineConfig, type Plugin } from 'vite';
import { resumeHtml, resumeText } from './src/render-html';

/** Bakes the resume into index.html and emits /resume.txt, so the CV works without JavaScript (and with curl). */
function resumePlugin(): Plugin {
  return {
    name: 'resume-prerender',
    transformIndexHtml(html) {
      return html.replace('<!--RESUME-->', resumeHtml());
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'resume.txt', source: resumeText() });
    },
    configureServer(server) {
      server.middlewares.use('/resume.txt', (_req, res) => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(resumeText());
      });
    },
  };
}

export default defineConfig({
  plugins: [resumePlugin()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
