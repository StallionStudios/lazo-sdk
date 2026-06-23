/** Lazo CRM SDK — create and list records via the Lazo API. */

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

/**
 * Search records by custom field (exact-match).
 */
export type SearchRecordsOptions = Record<string, string | number | boolean>

/** Options for listing records. */
export interface ListRecordsOptions {
	page?: number;
	limit?: number;
	sort?: "createdAt" | "updatedAt";
	order?: "asc" | "desc";
	deleted?: boolean;
}

/** Paginated list response from GET /api/{resource}. */
export interface ListRecordsResponse<T = Record<string, unknown>> {
	data: T[];
	total: number;
	page: number;
	limit: number;
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
	 */
	async createRecord<T = Record<string, unknown>>(
		resource: string,
		data: Record<string, unknown>
	): Promise<T> {
		return this.request<T>(`/api/resources/${resource}`, {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	/**
	 * List records for the given resource, paginated with `options` and filtered by `search`.
	 */
	async listRecords<T = Record<string, unknown>>(
		resource: string,
		search: SearchRecordsOptions = {},
		options: ListRecordsOptions = {}
	): Promise<ListRecordsResponse<T>> {
		const params = new URLSearchParams();
		for (const [k, v] of Object.entries(options)) {
			if (v !== undefined) params.set(k, String(v));
		}
		for (const [k, v] of Object.entries(search)) {
			if (v !== undefined) params.set(k, String(v));
		}
		const query = params.toString();
		const suffix = query ? `?${query}` : "";
		return this.request<ListRecordsResponse<T>>(`/api/resources/${resource}${suffix}`);
	}

	/**
	 * Fetch a single record by id.
	 */
	async getRecord<T = Record<string, unknown>>(
		resource: string,
		id: string
	): Promise<T> {
		return this.request<T>(`/api/resources/${resource}/${encodeURIComponent(id)}`);
	}

	private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
		const res = await fetch(`${this.baseUrl}${path}`, {
			...init,
			headers: {
				Authorization: `Bearer ${this.apiToken}`,
				"Content-Type": "application/json",
				...init.headers,
			},
		});

		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new LazoError(res.status, body.error ?? res.statusText);
		}
		return res.json() as Promise<T>;
	}
}
