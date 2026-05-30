export class StatusCodeNotFoundError extends Error {
	readonly code: string;

	constructor(code: string) {
		super(`Unknown status code: ${code}`);
		this.name = 'StatusCodeNotFoundError';
		this.code = code;
	}
}
