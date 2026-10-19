import { dataset } from '../data/load';
/** Query clock: frozen at the dataset's asOf in demo, real time in published mode. */
export const now = __DEMO__ ? dataset.asOf! : new Date().toISOString();
