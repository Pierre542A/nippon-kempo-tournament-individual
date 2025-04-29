import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import replicache, { setupMutators } from "./replicache/replicache";
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persistedstate';
import { setupAxios } from './plugins/axios'

setupMutators();

const app = createApp(App);
const pinia = createPinia()

pinia.use(piniaPersist)

app.use(pinia)
app.use(router);
app.use(
  createVuestic({
    icons: { defaultSet: "mdi", aliases: [], sets: ["mdi"] },
  })
);

setupAxios()

// verif si on est bien dans un environnement Electron
if (window && window.electron) {
  app.config.globalProperties.$electron = window.electron;
}
app.use(replicache);

app.mount("#app");
