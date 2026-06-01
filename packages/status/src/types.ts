// @scilence/status — types
//
// StatusEntry is the canonical shape of a single registry record.
// Title and detail are ICU-subset templates (see ./format.ts for the
// supported grammar): plain text, {var} interpolation, and
// {n, plural, one{...} other{...}} pluralization.

export type Severity = 'success' | 'info' | 'warning' | 'error';

export interface StatusEntry {
	code: string;
	severity: Severity;
	title: string;
	detail: string;
}
