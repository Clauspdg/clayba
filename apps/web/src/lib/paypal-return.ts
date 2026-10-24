/**
 * The passenger app's deep-link scheme (`apps/passenger-app/app.json`
 * `scheme`). PayPal's return/cancel pages hand an app booking back through
 * `theride://paypal/return` and `theride://paypal/cancel`, which open the
 * app's matching Expo Router routes.
 */
export const PASSENGER_APP_SCHEME = "theride";
