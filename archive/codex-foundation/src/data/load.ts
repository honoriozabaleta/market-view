import raw from '@dataset';
import { DatasetSchema } from '../domain/schema';
export const dataset = DatasetSchema.parse(raw);
if ((__DEMO__ && dataset.mode !== 'demo') || (!__DEMO__ && dataset.mode !== 'published')) {
  throw new Error('Build mode and dataset mode disagree');
}
