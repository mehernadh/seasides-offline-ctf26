# Seasides Online Store Write-up

## Challenge Overview
`Seasides Online Store` simulates an e-commerce site with a purchase limit on a "Limited Edition Bagpack" product. The goal is to bypass the limit by exploiting a race condition during the checkout process to obtain a hidden flag returned in one of the server responses.

---

## Recon & Setup
1. **Proxy configuration**
   - Configure Burp Suite (or a similar HTTP proxy) and ensure your browser traffic is routed through it.
   - Open the target site and make sure requests appear in the Proxy tab.

2. **Create a user account**
   - Register a new account and log in. Keep the session active in the browser.

3. **Prepare the shopping cart**
   - Navigate to the Shop page and add exactly **one** `Limited Edition Bagpack` to the cart.
   - Confirm the cart shows the item with quantity 1; more than one will invalidate the race condition.

---

## Exploiting the Race Condition
1. **Enable request interception**
   - In Burp Suite, go to **Proxy → Intercept** and turn interception on.

2. **Initiate checkout**
   - Click the `Checkout` button in the browser. Burp will intercept a `POST /api/checkout/init` request; forward it.
   - Shortly after, a `POST /api/checkout/confirm` request will be intercepted. Right-click this request and choose **Send to Repeater**. You can then forward or drop the original.
   - Disable interception after capturing the confirm request.

3. **Prepare parallel requests**
   - In the **Repeater** tab, locate the saved `POST /api/checkout/confirm` request. The body contains a `paymentId`; leave it unchanged.
   - Duplicate the request tab several times (5–10 copies) using the right-click **Duplicate tab** option.

4. **Trigger parallel submissions**
   - Select all duplicated tabs. If available, use **Send group (parallel)** or **Send selected requests in parallel**. This floods the server with nearly simultaneous confirmations.
   - If parallel sending is not available, click the `Send` button rapidly on each tab to create overlapping requests.

5. **Check for the flag**
   - Inspect each response. Most will be ordinary confirmations, but one response may include a JSON `flag` field.

```json
{
  "order": { ... },
  "flag": "SEASIDES{r4ce_c0nd1t10n_bypass}"
}
```

   - The value of the `flag` field is your capture the flag.

---

## Post‑Exploit Verification (Optional)
- Refresh the Shop page and view **Order History**; you should see multiple orders despite the single-item limit.
- Confirm that the account balance was decremented multiple times, proving the limit was bypassed.

---

## Conclusion
The application failed to properly serialize checkout confirmation requests, allowing multiple requests with the same `paymentId` to succeed when processed concurrently. By capturing the confirm request and replaying it in parallel, we forced the server into an inconsistent state where one response contained the hidden flag. This challenge emphasizes the importance of atomic operations and idempotency in e-commerce workflows.