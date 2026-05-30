export type StatusSeverity = 'success' | 'info' | 'warning' | 'error' | 'progress';

export type StatusSurface =
	| 'toast'
	| 'notification-center'
	| 'inline'
	| 'log'
	| 'api';

export type StatusEntry = {
	code: string;
	type?: string;
	category: StatusSeverity;
	http_status?: number;
	title: string;
	detail: string;
	remediation?: string;
	owning_feature: string;
	surfaces: StatusSurface[];
	doc_url?: string;
	telemetry_event?: string;
	provenance?: boolean;
	since?: string;
};

export type StatusParams = Record<string, string | number>;

export type ResolvedStatus = {
	code: string;
	severity: StatusSeverity;
	title: string;
	detail: string;
};
