# lazo-sdk

TypeScript SDK for the [Lazo Digital](https://lazo.digital) API.

```ts
import { LazoClient } from "lazo-sdk";

const lazo = new LazoClient({
  apiToken: process.env.LAZO_API_TOKEN!, // starts with `lazo_`
  baseUrl: "https://app.lazo.digital",
});

const contact = await lazo.createRecord("contacts", {
  name: "Ada Lovelace",
  email: "ada@example.com",
});
```

`createRecord(resource, data)` → `POST /api/{resource}`. Throws `LazoError`
(with `.status`) on non-2xx responses.
