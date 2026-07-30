import { z } from 'zod';
import { SharedActivitySchema } from '../schemas/activity.js';

export const SharedActivityCreatedEventSchema = z
  .object({ activity: SharedActivitySchema })
  .strict();
export type SharedActivityCreatedEvent = z.infer<
  typeof SharedActivityCreatedEventSchema
>;
