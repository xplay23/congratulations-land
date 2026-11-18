import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import App from './App.vue';
import { metadata, head } from './seo.mjs';

export async function render(path, hasQuery = false) {
  const meta = metadata(path);
  const html = await renderToString(createSSRApp(App, { path }));
  return { html, head: head(path, hasQuery), status: meta.status || 200 };
}
