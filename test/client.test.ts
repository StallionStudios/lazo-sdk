import { test } from "node:test";
import assert from "node:assert/strict";
import { LazoClient, LazoError } from "../src/index.ts";

function stubFetch(status: number, body: unknown) {
	const calls: { url: string; init: RequestInit }[] = [];
	globalThis.fetch = (async (url: string, init: RequestInit) => {
		calls.push({ url, init });
		return {
			ok: status >= 200 && status < 300,
			status,
			statusText: "stub",
			json: async () => body,
		};
	}) as unknown as typeof fetch;
	return calls;
}

test("createRecord posts to /api/{resource} with bearer token", async () => {
	const calls = stubFetch(201, { id: "1", name: "Ada" });
	const client = new LazoClient({ apiToken: "lazo_abc", baseUrl: "https://app.lazo.com/" });

	const rec = await client.createRecord("contacts", { name: "Ada" });

	assert.deepEqual(rec, { id: "1", name: "Ada" });
	assert.equal(calls[0].url, "https://app.lazo.com/api/resources/contacts"); // trailing slash trimmed
	assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer lazo_abc");
	assert.equal(calls[0].init.body, JSON.stringify({ name: "Ada" }));
});

test("createRecord throws LazoError on non-2xx", async () => {
	stubFetch(401, { error: "Invalid or expired token" });
	const client = new LazoClient({ apiToken: "lazo_bad", baseUrl: "https://app.lazo.com" });

	await assert.rejects(client.createRecord("contacts", {}), (e: LazoError) => {
		assert.equal(e.status, 401);
		assert.equal(e.message, "Invalid or expired token");
		return true;
	});
});

test("listRecords GETs /api/resources/{resource} with pagination + field filters", async () => {
	const calls = stubFetch(200, { data: [{ id: "1" }], total: 1, page: 1, limit: 25 });
	const client = new LazoClient({ apiToken: "lazo_abc", baseUrl: "https://app.lazo.com" });

	const res = await client.listRecords("contacts", { page: 2, email: "ada@x.com" });

	assert.deepEqual(res.data, [{ id: "1" }]);
	assert.equal(calls[0].url, "https://app.lazo.com/api/resources/contacts?page=2&email=ada%40x.com");
	assert.equal(calls[0].init.method, undefined); // GET is the fetch default
	assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer lazo_abc");
});

test("listRecords omits the query string when no params given", async () => {
	const calls = stubFetch(200, { data: [], total: 0, page: 1, limit: 25 });
	const client = new LazoClient({ apiToken: "lazo_abc", baseUrl: "https://app.lazo.com" });

	await client.listRecords("deals");

	assert.equal(calls[0].url, "https://app.lazo.com/api/resources/deals");
});

test("getRecord GETs /api/{resource}/{id} and returns the record", async () => {
	const calls = stubFetch(200, { id: "42", name: "Ada" });
	const client = new LazoClient({ apiToken: "lazo_abc", baseUrl: "https://app.lazo.com" });

	const rec = await client.getRecord("contacts", "42");

	assert.deepEqual(rec, { id: "42", name: "Ada" });
	assert.equal(calls[0].url, "https://app.lazo.com/api/resources/contacts/42");
});
