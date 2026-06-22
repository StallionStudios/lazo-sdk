/** Lazo CRM SDK — phase 1: create records via the Lazo API. */

export interface LazoClientOptions {
	/** API token from Lazo (starts with `lazo_`). */
	apiToken: string;
	/** Base URL of the Lazo instance, e.g. https://app.lazo.digital */
	baseUrl: string;
}

export class LazoError extends Error {
	constructor(public status: number, message: string) {
		super(message);
		this.name = "LazoError";
	}
}

export class LazoClient {
	private readonly apiToken: string;
	private readonly baseUrl: string;

	constructor(options: LazoClientOptions) {
		if (!options.apiToken) throw new Error("apiToken is required");
		if (!options.baseUrl) throw new Error("baseUrl is required");
		this.apiToken = options.apiToken;
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
	}

	/**
	 * Create a record for the given resource (e.g. "contacts", "deals").
	 * Maps to POST /api/{resource} on the Lazo API.
	 */
	async createRecord<T = Record<string, unknown>>(
		resource: string,
		data: Record<string, unknown>
	): Promise<T> {
		const res = await fetch(`${this.baseUrl}/api/${resource}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new LazoError(res.status, body.error ?? res.statusText);
		}
		return res.json() as Promise<T>;
	}
}
