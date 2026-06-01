// @scilence/status — typed errors

export class StatusCodeNotFoundError extends Error {
	readonly code: string;

	constructor(code: string) {
		super(`Status code not found: ${code}`);
		this.name = 'StatusCodeNotFoundError';
		this.code = code;
	}
}
