/**
 * Minimal PayPal REST client (Orders v2 + Payments v2) — just the four
 * calls the authorize-at-booking / capture-at-completion flow needs (see
 * docs/payments.md). Plain `fetch`, no SDK: PayPal's Node SDK is
 * deprecated and this keeps the functions bundle dependency-free. `fetch`
 * is injectable so `paypal.test.ts` can exercise it without the network.
 */

export type PaypalEnvironment = "sandbox" | "live";

export interface PaypalConfig {
  clientId: string;
  clientSecret: string;
  environment: PaypalEnvironment;
}

export class PaypalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PaypalApiError";
  }
}

const BASE_URLS: Record<PaypalEnvironment, string> = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

function formatAmount(value: number): string {
  return value.toFixed(2);
}

export interface PaypalAuthorization {
  id: string;
  status: string;
  amount: number;
}

export class PaypalClient {
  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(
    private readonly config: PaypalConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private get baseUrl(): string {
    return BASE_URLS[this.config.environment];
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) {
      return this.accessToken.value;
    }
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString(
      "base64",
    );
    const response = await this.fetchImpl(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!response.ok) {
      throw new PaypalApiError(
        "PayPal authentication failed",
        response.status,
        await safeJson(response),
      );
    }
    const body = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  /** `requestId` becomes PayPal's idempotency key — a retried call with the same id returns the original result. */
  private async call<T>(
    method: "POST" | "GET",
    path: string,
    requestId: string,
    body?: unknown,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": requestId,
        Prefer: "return=representation",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const details = await safeJson(response);
      const name = (details as { name?: string } | undefined)?.name;
      throw new PaypalApiError(
        `PayPal ${method} ${path} failed${name ? `: ${name}` : ""}`,
        response.status,
        details,
      );
    }
    return (response.status === 204 ? undefined : await response.json()) as T;
  }

  /** Creates an AUTHORIZE-intent order and returns the URL the passenger must approve it at. */
  async createAuthorizeOrder(params: {
    referenceId: string;
    amount: number;
    currency: string;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{ orderId: string; approveUrl: string }> {
    const order = await this.call<{ id: string; links?: { rel: string; href: string }[] }>(
      "POST",
      "/v2/checkout/orders",
      `order-${params.referenceId}`,
      {
        intent: "AUTHORIZE",
        purchase_units: [
          {
            reference_id: params.referenceId,
            custom_id: params.referenceId,
            description: params.description,
            amount: { currency_code: params.currency, value: formatAmount(params.amount) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "CLAYBA",
              shipping_preference: "NO_SHIPPING",
              user_action: "CONTINUE",
              return_url: params.returnUrl,
              cancel_url: params.cancelUrl,
            },
          },
        },
      },
    );
    const approveUrl = order.links?.find(
      (l) => l.rel === "payer-action" || l.rel === "approve",
    )?.href;
    if (!approveUrl) {
      throw new PaypalApiError("PayPal order has no approval link", 502, order);
    }
    return { orderId: order.id, approveUrl };
  }

  /** Places the hold, once the passenger has approved the order on PayPal. */
  async authorizeOrder(orderId: string): Promise<PaypalAuthorization> {
    const order = await this.call<{
      purchase_units?: {
        payments?: { authorizations?: { id: string; status: string; amount: { value: string } }[] };
      }[];
    }>("POST", `/v2/checkout/orders/${orderId}/authorize`, `authorize-${orderId}`, {});
    const authorization = order.purchase_units?.[0]?.payments?.authorizations?.[0];
    if (!authorization) {
      throw new PaypalApiError("PayPal returned no authorization", 502, order);
    }
    return {
      id: authorization.id,
      status: authorization.status,
      amount: Number(authorization.amount.value),
    };
  }

  async captureAuthorization(params: {
    authorizationId: string;
    amount: number;
    currency: string;
    invoiceId: string;
  }): Promise<{ id: string; status: string }> {
    return this.call(
      "POST",
      `/v2/payments/authorizations/${params.authorizationId}/capture`,
      `capture-${params.authorizationId}`,
      {
        amount: { currency_code: params.currency, value: formatAmount(params.amount) },
        invoice_id: params.invoiceId,
        final_capture: true,
      },
    );
  }

  async voidAuthorization(authorizationId: string): Promise<void> {
    await this.call(
      "POST",
      `/v2/payments/authorizations/${authorizationId}/void`,
      `void-${authorizationId}`,
    );
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
