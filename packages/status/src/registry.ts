// @scilence/status — seed registry
//
// Five canonical status codes seeded for the first cut of the catalog.
// Templates use the ICU-subset grammar implemented in ./format.ts.

import type { StatusEntry } from './types.js';

export const STATUS_REGISTRY: Readonly<Record<string, StatusEntry>> = Object.freeze({
	'etl.intake.job_complete': {
		code: 'etl.intake.job_complete',
		severity: 'success',
		title: 'Intake job complete',
		detail: 'Intake job {jobId} finished for {library}.',
	},
	'library.ingest.duplicate_smiles': {
		code: 'library.ingest.duplicate_smiles',
		severity: 'error',
		title: '{n, plural, one{# duplicate} other{# duplicates}} in {library}',
		detail:
			'{n, plural, one{# row was} other{# rows were}} flagged as duplicate SMILES in {library}.',
	},
	'reactivity.premise_changed': {
		code: 'reactivity.premise_changed',
		severity: 'warning',
		title: 'Premise changed',
		detail: 'Premise {premise} changed; downstream reactivity results may be stale.',
	},
	'notification.center.mark_all_read': {
		code: 'notification.center.mark_all_read',
		severity: 'info',
		title: 'All notifications marked as read',
		detail:
			'{n, plural, one{# notification was} other{# notifications were}} marked as read.',
	},
	'etl.intake.automap_failed': {
		code: 'etl.intake.automap_failed',
		severity: 'error',
		title: 'Automap failed',
		detail: 'Could not automatically map columns for intake job {jobId}.',
	},
});
