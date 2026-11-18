import { createSSRApp } from 'vue';
import App from './App.vue';

createSSRApp(App, { path: window.location.pathname }).mount('#app');
