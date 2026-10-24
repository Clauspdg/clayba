import { describe, expect, it, vi } from "vitest";

import { PaypalApiError, PaypalClient } from "./paypal";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clientWith(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>();
  fetchMock.mockResolvedValueOnce(jsonResponse(200, { access_token: "tok", expires_in: 3600 }));
  for (const r of responses) fetchMock.mockResolvedValueOnce(r);
  const client = new PaypalClient(
    { clientId: "id", clientSecret: "secret", environment: "sandbox" },
    fetchMock,
  );
  return { client, fetchMock };
}

describe("PaypalClient", () => {
  it("creates an AUTHORIZE order and returns the payer-action link", async () => {
    const { client, fetchMock } = clientWith(
      jsonResponse(201, {
        id: "ORDER1",
        links: [
          { rel: "payer-action", href: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1" },
        ],
      }),
    );

    const result = await client.createAuthorizeOrder({
      referenceId: "req1",
      amount: 12.3,
      currency: "USD",
      description: "CLAYBA ride",
      returnUrl: "https://example.com/r",
      cancelUrl: "https://example.com/c",
    });

    expect(result).toEqual({
      orderId: "ORDER1",
      approveUrl: "https://www.sandbox.paypal.com/checkoutnow?token=ORDER1",
    });
    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
    const body = JSON.parse(init!.body as string);
    expect(body.intent).toBe("AUTHORIZE");
    expect(body.purchase_units[0].amount).toEqual({ currency_code: "USD", value: "12.30" });
    expect((init!.headers as Record<string, string>)["PayPal-Request-Id"]).toBe("order-req1");
  });

  it("reuses the access token across calls", async () => {
    const { client, fetchMock } = clientWith(
      jsonResponse(201, {
        purchase_units: [
          {
            payments: {
              authorizations: [{ id: "AUTH1", status: "CREATED", amount: { value: "12.30" } }],
            },
          },
        ],
      }),
      new Response(null, { status: 204 }),
    );

    await expect(client.authorizeOrder("ORDER1")).resolves.toEqual({
      id: "AUTH1",
      status: "CREATED",
      amount: 12.3,
    });
    await client.voidAuthorization("AUTH1");

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/v1/oauth2/token"),
    );
    expect(tokenCalls).toHaveLength(1);
  });

  it("captures the given amount as a final capture", async () => {
    const { client, fetchMock } = clientWith(
      jsonResponse(201, { id: "CAP1", status: "COMPLETED" }),
    );

    await expect(
      client.captureAuthorization({
        authorizationId: "AUTH1",
        amount: 14,
        currency: "USD",
        invoiceId: "trip1",
      }),
    ).resolves.toEqual({ id: "CAP1", status: "COMPLETED" });

    const body = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
    expect(body).toEqual({
      amount: { currency_code: "USD", value: "14.00" },
      invoice_id: "trip1",
      final_capture: true,
    });
  });

  it("surfaces PayPal's error name", async () => {
    const { client } = clientWith(jsonResponse(422, { name: "UNPROCESSABLE_ENTITY" }));

    await expect(client.authorizeOrder("ORDER1")).rejects.toThrow(PaypalApiError);
  });
});
