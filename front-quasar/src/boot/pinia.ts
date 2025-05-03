// src/boot/pinia.ts
import { boot } from 'quasar/wrappers'   // ← boot(), pas defineBoot
import { createPinia } from 'pinia'

/** Instance Pinia partagée */
const pinia = createPinia()

export default boot(({ app }) => {
  // Quasar t’injecte 'app' déjà typé => plus d'erreur TS7031
  app.use(pinia)
})
