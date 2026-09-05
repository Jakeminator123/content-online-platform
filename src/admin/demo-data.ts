import { demoWorkspace as fixtures } from './demo-fixtures.js';
import { buildWorkspaceStatistics } from './statistics.js';

// Immutable presentation data. The selection is recalculated, not stored as a cron result.
export const demoWorkspace = {
  ...fixtures,
  get statistics() {
    const day = new Date().toISOString().slice(0, 10);
    return buildWorkspaceStatistics(fixtures, new Date(day + 'T00:00:00Z'));
  },
};
export type DemoWorkspace = typeof demoWorkspace;
