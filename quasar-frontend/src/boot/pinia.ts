import { boot } from 'quasar/wrappers';
import { createPinia, setActivePinia, type Pinia } from 'pinia';

export const pinia = createPinia();

export function getAppPinia(): Pinia {
  setActivePinia(pinia);
  return pinia;
}

export default boot(({ app }) => {
  app.use(pinia);
  setActivePinia(pinia);
});
