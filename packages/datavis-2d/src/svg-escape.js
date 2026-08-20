/** @param {string} value */
export function escapeXml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** @param {string} value */
export function escapeAttr(value) {
	return escapeXml(value).replace(/'/g, "&#39;");
}
