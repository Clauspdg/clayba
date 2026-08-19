"use client";

import { clearBookingDraft, loadBookingDraft, saveBookingDraft } from "@/lib/booking-draft";
import { webFirestore } from "@/lib/firebase-client";
import { estimateFareForCategory, resolveRoute, type RouteEstimate } from "@/lib/fare-estimate";
import { getMapProvider } from "@/lib/map-provider";
import { getDefaultScheduleSlot, getTodayDateString } from "@/lib/schedule-defaults";
import {
  createTripRequest,
  getGlobalSettings,
  getOrCreatePassengerProfile,
  subscribeFavoritePlaces,
} from "@the-ride/firebase/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  DatePicker,
  ErrorState,
  Heading,
  Icon,
  Input,
  LoadingState,
  RadioGroupField,
  Select,
  TimePicker,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth, useDebouncedValue } from "@the-ride/hooks";
import type {
  AddressSuggestion,
  FavoritePlace,
  GeoLocation,
  PlatformSettings,
  VehicleCategory,
} from "@the-ride/types";
import { FirebaseError } from "firebase/app";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useUserExperience } from "@/hooks/useUserExperience";

const DESTINATION_SEARCH_DEBOUNCE_MS = 300;
const DESTINATION_SEARCH_MIN_CHARS = 2;
const MAX_STOPS = 3;
// Clayba's current launch market — biases (never restricts) address
// search results toward Nassau/New Providence. See docs/maps.md.
const NASSAU_SEARCH_BIAS = { lat: 25.0343, lng: -77.3963, radiusMeters: 50_000 };

interface AddressFieldState {
  text: string;
  location: GeoLocation | null;
  busy: boolean;
  error: string | null;
}

const EMPTY_ADDRESS: AddressFieldState = { text: "", location: null, busy: false, error: null };
const PASSENGER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];

/**
 * FUNCTIONAL-STABILIZATION — `err.message` from a `FirebaseError` (e.g.
 * "Missing or insufficient permissions.", "FirebaseError: ...") is
 * developer-facing, not user-facing; it was previously shown verbatim in
 * both the load-error banner and the Confirm Ride failure toast. Logs the
 * real error for debugging, shows a translated, honest message to the
 * passenger — same split as `describeSaveError` in become-a-driver/page.tsx.
 */
function describeBookingError(err: unknown, t: (key: string) => string): string {
  console.error("[book] request failed", err);
  if (err instanceof FirebaseError && err.code === "permission-denied") {
    return t("booking.permissionErrorBody");
  }
  return t("common.error");
}

function BookRidePageContent() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: experienceLoading, capabilities, preferredLandingRoute } = useUserExperience();

  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);
  const [categories, setCategories] = useState<VehicleCategory[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // BOOKING-01 fix — pre-fill from the homepage BookingCard's handoff
  // (`?pickup=`/`?destination=`/`?stop=`/`?passengers=`/`?scheduledDate=`/
  // `?scheduledTime=`) when present; a direct visit to /book with no query
  // params behaves exactly as before (all empty), UNLESS a saved draft from
  // an earlier /book visit this tab session exists — FUNCTIONAL-
  // STABILIZATION: a reload or accidental back-navigation previously lost
  // every field the passenger had already entered. An explicit handoff
  // always wins over a stale draft (it reflects the passenger's current
  // intent from the homepage, not a leftover from before).
  const hasHandoffParams = Boolean(
    searchParams.get("pickup") || searchParams.get("destination") || searchParams.get("stop"),
  );
  const initialDraft = hasHandoffParams ? null : loadBookingDraft();

  const [pickup, setPickup] = useState<AddressFieldState>(() => {
    const text = searchParams.get("pickup");
    if (text) return { ...EMPTY_ADDRESS, text };
    return initialDraft ? { ...EMPTY_ADDRESS, ...initialDraft.pickup } : EMPTY_ADDRESS;
  });
  const [destination, setDestination] = useState<AddressFieldState>(() => {
    const text = searchParams.get("destination");
    if (text) return { ...EMPTY_ADDRESS, text };
    return initialDraft ? { ...EMPTY_ADDRESS, ...initialDraft.destination } : EMPTY_ADDRESS;
  });
  const [stops, setStops] = useState<AddressFieldState[]>(() => {
    const fromQuery = searchParams.getAll("stop").map((text) => ({ ...EMPTY_ADDRESS, text }));
    if (fromQuery.length > 0) return fromQuery;
    return initialDraft?.stops.map((s) => ({ ...EMPTY_ADDRESS, ...s })) ?? [];
  });
  const [locating, setLocating] = useState(false);

  const [passengerCount, setPassengerCount] = useState(() => {
    const fromQuery = Number(searchParams.get("passengers"));
    if (PASSENGER_COUNT_OPTIONS.includes(fromQuery)) return fromQuery;
    return initialDraft && PASSENGER_COUNT_OPTIONS.includes(initialDraft.passengerCount)
      ? initialDraft.passengerCount
      : 1;
  });
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">(() => {
    if (searchParams.get("scheduledDate") && searchParams.get("scheduledTime")) return "later";
    return initialDraft?.scheduleMode ?? "now";
  });
  // BOOKING-UX-01 — default to today / now+5min (rounded to a clean 5-minute
  // slot) rather than blank fields, so switching to "Schedule for later"
  // starts from a sensible, immediately-bookable moment instead of an empty
  // native date/time picker. Computed once from real wall-clock time at
  // mount, same pattern as the homepage-handoff query-param defaults above.
  const [scheduledDate, setScheduledDate] = useState(
    () =>
      searchParams.get("scheduledDate") ??
      initialDraft?.scheduledDate ??
      getDefaultScheduleSlot().date,
  );
  const [scheduledTime, setScheduledTime] = useState(
    () =>
      searchParams.get("scheduledTime") ??
      initialDraft?.scheduledTime ??
      getDefaultScheduleSlot().time,
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    () => initialDraft?.selectedCategoryId ?? null,
  );
  const [confirming, setConfirming] = useState(false);

  // BOOKING-UX-01 — destination autocomplete. `lastAppliedDestinationRef`
  // tracks whatever text a selection (or a resolved geocode) last produced,
  // so re-running the debounced search effect after a *selection* doesn't
  // immediately re-search the very text it just set — but resuming typing
  // (which changes the text away from that value) searches again normally,
  // so picking a different destination afterward still works.
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSearchStatus, setDestinationSearchStatus] = useState<
    "idle" | "loading" | "empty" | "error"
  >("idle");
  const [destinationFocused, setDestinationFocused] = useState(false);
  const lastAppliedDestinationRef = useRef<string | null>(null);
  const debouncedDestinationText = useDebouncedValue(
    destination.text,
    DESTINATION_SEARCH_DEBOUNCE_MS,
  );

  // Redirect away if this account can't book rides at all (guest is already
  // handled by RequireAuth; this covers staff/admin, the one authenticated
  // state with no passenger capability — see docs/booking-handoff-audit.md).
  useEffect(() => {
    if (!experienceLoading && capabilities && !capabilities.canBookRide) {
      router.replace(preferredLandingRoute ?? "/");
    }
  }, [experienceLoading, capabilities, preferredLandingRoute, router]);

  useEffect(() => {
    if (!session) return;
    let unsubPlaces: (() => void) | undefined;
    let cancelled = false;
    // `favoritePlaces` lives under `passengers/{uid}` — that profile doc may
    // not exist yet for a passenger who has never hit a profile-creating
    // flow before landing on /book directly (see saved-places/page.tsx for
    // the same guard), so ensure it exists first rather than subscribing
    // straight into a missing-parent query, which the Firestore rules deny.
    getOrCreatePassengerProfile(webFirestore, session.uid)
      .then(() => {
        if (cancelled) return;
        unsubPlaces = subscribeFavoritePlaces(webFirestore, session.uid, setPlaces, setLoadError);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(describeBookingError(err, t));
      });

    const q = query(
      collection(webFirestore, "vehicleCategories"),
      where("isActive", "==", true),
      orderBy("sortOrder", "asc"),
    );
    const unsubCategories = onSnapshot(
      q,
      (snapshot) =>
        setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as VehicleCategory)),
      (err) => setLoadError(describeBookingError(err, t)),
    );
    void getGlobalSettings(webFirestore).then(setSettings);
    return () => {
      cancelled = true;
      unsubPlaces?.();
      unsubCategories();
    };
  }, [session]);

  async function resolveManualAddress(text: string, apply: (next: AddressFieldState) => void) {
    const trimmed = text.trim();
    if (!trimmed) {
      apply({ text, location: null, busy: false, error: null });
      return;
    }
    apply({ text, location: null, busy: true, error: null });
    try {
      const result = await getMapProvider().geocode(trimmed);
      apply({
        text: result.formattedAddress,
        location: {
          lat: result.location.lat,
          lng: result.location.lng,
          address: result.formattedAddress,
        },
        busy: false,
        error: null,
      });
    } catch {
      apply({ text, location: null, busy: false, error: t("booking.addressLookupUnavailable") });
    }
  }

  // Runs once on mount only: resolve real coordinates for whatever text the
  // homepage handoff pre-filled above, exactly as if the passenger had
  // typed and blurred each field themselves (same honest success/failure
  // path — no geocoding key configured in this environment still means an
  // honest "address lookup unavailable" here, same as manual entry).
  // FUNCTIONAL-STABILIZATION — skip whenever `location` is already set: a
  // restored booking draft (see `loadBookingDraft` above) already carries
  // real coordinates, and re-geocoding here would silently throw them away
  // the moment this effect ran (a real regression this fix avoids — no
  // geocoding key is configured in this environment, so every one of these
  // calls would fail and wipe a perfectly good saved location).
  useEffect(() => {
    if (pickup.text && !pickup.location) void resolveManualAddress(pickup.text, setPickup);
    if (destination.text && !destination.location)
      void resolveManualAddress(destination.text, setDestination);
    stops.forEach((stop, index) => {
      if (stop.text && !stop.location)
        void resolveManualAddress(stop.text, (next) => updateStop(index, next));
    });
  }, []);

  // FUNCTIONAL-STABILIZATION — persist the in-progress draft on every
  // meaningful change so a reload/back-navigation doesn't lose it (see
  // `booking-draft.ts`). Only `text`/`location` are kept per address field —
  // `busy`/`error` are transient UI state, not part of "what the passenger
  // entered." Cleared on a successful `createTripRequest` (`handleConfirm`)
  // so a draft is never confused with an already-confirmed Ride.
  useEffect(() => {
    saveBookingDraft({
      pickup: { text: pickup.text, location: pickup.location },
      destination: { text: destination.text, location: destination.location },
      stops: stops.map((s) => ({ text: s.text, location: s.location })),
      passengerCount,
      scheduleMode,
      scheduledDate,
      scheduledTime,
      selectedCategoryId,
    });
  }, [
    pickup.text,
    pickup.location,
    destination.text,
    destination.location,
    stops,
    passengerCount,
    scheduleMode,
    scheduledDate,
    scheduledTime,
    selectedCategoryId,
  ]);

  // BOOKING-UX-01 — reuses the same `MapProviderClient.autocomplete()` the
  // passenger-app's location-search screen already calls (see
  // `apps/passenger-app/src/app/booking/location-search.tsx`); no new
  // provider or search architecture, just wiring the existing one into web.
  useEffect(() => {
    const trimmed = debouncedDestinationText.trim();
    if (
      trimmed.length < DESTINATION_SEARCH_MIN_CHARS ||
      trimmed === lastAppliedDestinationRef.current
    ) {
      setDestinationSuggestions([]);
      setDestinationSearchStatus("idle");
      return;
    }
    let cancelled = false;
    setDestinationSearchStatus("loading");
    void (async () => {
      try {
        const suggestions = await getMapProvider().autocomplete(trimmed, {
          bias: NASSAU_SEARCH_BIAS,
        });
        if (cancelled) return;
        setDestinationSuggestions(suggestions);
        setDestinationSearchStatus(suggestions.length === 0 ? "empty" : "idle");
      } catch {
        if (cancelled) return;
        setDestinationSuggestions([]);
        setDestinationSearchStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedDestinationText]);

  async function selectDestinationSuggestion(suggestion: AddressSuggestion) {
    setDestinationSearchStatus("loading");
    try {
      const geocoded = await getMapProvider().geocode(suggestion.description);
      lastAppliedDestinationRef.current = geocoded.formattedAddress;
      setDestination({
        text: geocoded.formattedAddress,
        location: {
          lat: geocoded.location.lat,
          lng: geocoded.location.lng,
          address: geocoded.formattedAddress,
        },
        busy: false,
        error: null,
      });
      setDestinationSuggestions([]);
      setDestinationSearchStatus("idle");
    } catch {
      setDestinationSearchStatus("error");
    }
  }

  function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      const message = t("booking.locationUnsupported");
      setPickup({ ...EMPTY_ADDRESS, error: message });
      toast({ variant: "danger", title: message });
      return;
    }
    setLocating(true);
    setPickup((prev) => ({ ...prev, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        void (async () => {
          let address = t("booking.currentLocation");
          try {
            const result = await getMapProvider().reverseGeocode({ lat, lng });
            address = result.formattedAddress;
          } catch {
            // Honest fallback — no reverse-geocoding key configured in this environment.
          }
          setPickup({ text: address, location: { lat, lng, address }, busy: false, error: null });
          setLocating(false);
        })();
      },
      (error) => {
        setLocating(false);
        let message = t("booking.locationUnavailable");
        if (error.code === error.PERMISSION_DENIED) message = t("booking.locationDenied");
        else if (error.code === error.TIMEOUT) message = t("booking.locationTimeout");
        setPickup((prev) => ({ ...prev, error: message }));
        toast({ variant: "danger", title: message });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }

  function selectSavedPlace(place: FavoritePlace, apply: (next: AddressFieldState) => void) {
    apply({
      text: place.label,
      location: { lat: place.lat, lng: place.lng, address: place.address },
      busy: false,
      error: null,
    });
  }

  function addStop() {
    if (stops.length >= MAX_STOPS) return;
    setStops([...stops, EMPTY_ADDRESS]);
  }

  function updateStop(index: number, next: AddressFieldState) {
    setStops(stops.map((s, i) => (i === index ? next : s)));
  }

  function removeStop(index: number) {
    setStops(stops.filter((_, i) => i !== index));
  }

  const stopLocations = useMemo(
    () => stops.map((s) => s.location).filter((loc): loc is GeoLocation => loc !== null),
    [stops],
  );

  // FUNCTIONAL-STABILIZATION — real route (distance/duration) via the
  // configured map provider's `getRoute()`, honest straight-line fallback
  // when it's unavailable (see `resolveRoute`'s doc comment). Async because
  // a real routing call is a network request, unlike the old synchronous
  // haversine-only `useMemo` this replaces.
  const [route, setRoute] = useState<RouteEstimate | null>(null);
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "ready">("idle");
  useEffect(() => {
    if (!pickup.location || !destination.location) {
      setRoute(null);
      setRouteStatus("idle");
      return;
    }
    let cancelled = false;
    setRouteStatus("loading");
    void resolveRoute([pickup.location, ...stopLocations, destination.location]).then((result) => {
      if (cancelled) return;
      setRoute(result);
      setRouteStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [pickup.location, destination.location, stopLocations]);

  const eligibleCategories = useMemo(
    () => (categories ?? []).filter((c) => c.maximumPassengers >= passengerCount),
    [categories, passengerCount],
  );

  const fareByCategory = useMemo(() => {
    if (!route || !settings) return null;
    return new Map(
      eligibleCategories.map((category) => [
        category.id,
        estimateFareForCategory(route, category, settings),
      ]),
    );
  }, [route, settings, eligibleCategories]);

  async function handleConfirm() {
    if (
      !session ||
      !pickup.location ||
      !destination.location ||
      !selectedCategoryId ||
      !fareByCategory ||
      !route
    )
      return;
    const fareEstimate = fareByCategory.get(selectedCategoryId);
    if (!fareEstimate) return;

    setConfirming(true);
    try {
      await createTripRequest(webFirestore, {
        passengerId: session.uid,
        pickup: pickup.location,
        dropoff: destination.location,
        stops: stopLocations,
        passengerCount,
        vehicleCategoryId: selectedCategoryId,
        estimatedDistanceMeters: route.distanceMeters,
        estimatedDurationSeconds: route.durationSeconds,
        fareEstimate,
      });
      clearBookingDraft();
      toast({ variant: "success", title: t("booking.confirmed") });
      router.push("/rides");
    } catch (err) {
      toast({ variant: "danger", title: describeBookingError(err, t) });
    } finally {
      setConfirming(false);
    }
  }

  if (loadError && (places === null || categories === null)) {
    return (
      <div className="flex flex-col gap-6">
        <Heading level={2}>{t("passengerNav.bookRide")}</Heading>
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={loadError} />
      </div>
    );
  }

  if (categories === null || experienceLoading || (capabilities && !capabilities.canBookRide)) {
    return <LoadingState title={t("common.loading")} />;
  }

  const savedPlaces = places ?? [];

  function renderSavedPlaceChips(apply: (next: AddressFieldState) => void) {
    if (savedPlaces.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t("booking.savedPlacesHint")}:
        </span>
        {savedPlaces.map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => selectSavedPlace(place, apply)}
            className="duration-fast hover:border-brand hover:text-brand rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-700 transition-colors dark:border-neutral-700 dark:text-neutral-300"
          >
            {place.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("passengerNav.bookRide")}</Heading>
      {loadError && <p className="text-danger text-sm">{loadError}</p>}

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {t("booking.pickupLabel")}
            </span>
            {/* BOOKING-UX-01 — Current Location is now the first, most
                prominent pickup option (was a secondary button to the right
                of the manual input); the manual input below stays fully
                editable, so typing a different pickup still works exactly
                as before. */}
            <Button
              type="button"
              variant="primary"
              onClick={handleUseCurrentLocation}
              isLoading={locating}
              fullWidth
              className="justify-start gap-2"
            >
              <Icon name="navigation" size={16} />
              {t("booking.useCurrentLocation")}
            </Button>
            {pickup.error && <p className="text-danger text-sm">{pickup.error}</p>}
            <Input
              placeholder={t("booking.pickupPlaceholder")}
              value={pickup.text}
              helperText={pickup.busy ? t("booking.locatingLabel") : undefined}
              onChange={(e) =>
                setPickup((prev) => ({ ...prev, text: e.target.value, error: null }))
              }
              onBlur={(e) => void resolveManualAddress(e.target.value, setPickup)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void resolveManualAddress(pickup.text, setPickup);
              }}
            />
            {renderSavedPlaceChips(setPickup)}
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                label={t("booking.destinationLabel")}
                placeholder={t("booking.destinationPlaceholder")}
                value={destination.text}
                errorText={destination.error ?? undefined}
                helperText={destination.busy ? t("booking.locatingLabel") : undefined}
                autoComplete="off"
                onChange={(e) =>
                  setDestination((prev) => ({ ...prev, text: e.target.value, error: null }))
                }
                onFocus={() => setDestinationFocused(true)}
                onBlur={(e) => {
                  setDestinationFocused(false);
                  void resolveManualAddress(e.target.value, setDestination);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    void resolveManualAddress(destination.text, setDestination);
                  if (e.key === "Escape") setDestinationSearchStatus("idle");
                }}
              />
              {destinationFocused &&
                debouncedDestinationText.trim().length >= DESTINATION_SEARCH_MIN_CHARS &&
                destinationSearchStatus !== "idle" && (
                  <div
                    role="listbox"
                    className="shadow-elevation3 absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {destinationSearchStatus === "loading" && (
                      <p className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {t("common.loading")}
                      </p>
                    )}
                    {destinationSearchStatus === "empty" && (
                      <p className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {t("common.noResults")}
                      </p>
                    )}
                    {destinationSearchStatus === "error" && (
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                          {t("booking.searchErrorTitle")}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t("booking.searchErrorBody")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              {destinationFocused && destinationSuggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="shadow-elevation3 absolute top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {destinationSuggestions.map((suggestion) => (
                    <li key={suggestion.placeId} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          void selectDestinationSuggestion(suggestion);
                        }}
                        className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <span className="text-neutral-900 dark:text-neutral-50">
                          {suggestion.mainText}
                        </span>
                        {suggestion.secondaryText && (
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {suggestion.secondaryText}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {renderSavedPlaceChips(setDestination)}
          </div>

          {stops.map((stop, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label={t("booking.stopLabel", { number: index + 1 })}
                    placeholder={t("booking.stopPlaceholder")}
                    value={stop.text}
                    errorText={stop.error ?? undefined}
                    helperText={stop.busy ? t("booking.locatingLabel") : undefined}
                    onChange={(e) =>
                      updateStop(index, { ...stop, text: e.target.value, error: null })
                    }
                    onBlur={(e) =>
                      void resolveManualAddress(e.target.value, (next) => updateStop(index, next))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        void resolveManualAddress(stop.text, (next) => updateStop(index, next));
                    }}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeStop(index)}>
                  {t("common.delete")}
                </Button>
              </div>
              {renderSavedPlaceChips((next) => updateStop(index, next))}
            </div>
          ))}
          {stops.length < MAX_STOPS && (
            <Button variant="outline" size="sm" onClick={addStop} className="self-start">
              {t("booking.addStop")}
            </Button>
          )}

          <div className="tablet:grid-cols-2 grid gap-4">
            <Select
              label={t("booking.passengerCountLabel")}
              value={String(passengerCount)}
              onValueChange={(value) => setPassengerCount(Number(value))}
              options={PASSENGER_COUNT_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            />
            <div className="flex flex-col gap-2">
              <RadioGroupField
                name="schedule-mode"
                value={scheduleMode}
                onValueChange={(value) => setScheduleMode(value as "now" | "later")}
                options={[
                  { value: "now", label: t("booking.scheduleNow") },
                  { value: "later", label: t("booking.scheduleLater") },
                ]}
              />
            </div>
          </div>

          {scheduleMode === "later" && (
            <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
              <div className="tablet:grid-cols-2 grid gap-4">
                <DatePicker
                  label={t("booking.scheduledDateLabel")}
                  value={scheduledDate}
                  min={getTodayDateString()}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <TimePicker
                  label={t("booking.scheduledTimeLabel")}
                  value={scheduledTime}
                  min={
                    scheduledDate === getTodayDateString()
                      ? getDefaultScheduleSlot().time
                      : undefined
                  }
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <span className="font-medium text-neutral-900 dark:text-neutral-50">
                  {t("booking.scheduledNotSupportedTitle")}
                </span>{" "}
                {t("booking.scheduledNotSupportedBody")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {routeStatus === "loading" && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("booking.calculatingRoute")}
        </p>
      )}

      {route && fareByCategory && (
        <div className="flex flex-col gap-4">
          <div>
            <Heading level={3}>{t("booking.chooseVehicleTitle")}</Heading>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("booking.estimatedDistance", { km: (route.distanceMeters / 1000).toFixed(1) })}
              {" · "}
              {t("booking.estimatedDuration", {
                minutes: String(Math.round(route.durationSeconds / 60)),
              })}
            </p>
          </div>
          {eligibleCategories.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("booking.noCategoriesForPassengerCount", { count: passengerCount })}
            </p>
          ) : (
            <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-4">
              {eligibleCategories.map((category) => {
                const fare = fareByCategory.get(category.id);
                const selected = selectedCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className="text-left"
                  >
                    <Card className={selected ? "border-brand ring-brand ring-2" : ""}>
                      <CardContent className="flex flex-col gap-2 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-900 dark:text-neutral-50">
                            {category.name}
                          </span>
                          {selected && <Badge tone="brand">{t("booking.selected")}</Badge>}
                        </div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {category.description}
                        </span>
                        <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                          {fare ? `${fare.total.toFixed(2)} ${fare.currency}` : "—"}
                        </span>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}

          {selectedCategoryId &&
            fareByCategory.get(selectedCategoryId) &&
            (() => {
              const fare = fareByCategory.get(selectedCategoryId)!;
              return (
                <Card>
                  <CardContent className="flex flex-col gap-2 p-4">
                    <FareLine
                      label={t("booking.fareBase")}
                      value={fare.baseFare}
                      currency={fare.currency}
                    />
                    <FareLine
                      label={t("booking.fareDistance")}
                      value={fare.distanceFare}
                      currency={fare.currency}
                    />
                    <FareLine
                      label={t("booking.fareTime")}
                      value={fare.timeFare}
                      currency={fare.currency}
                    />
                    {fare.bookingFee > 0 && (
                      <FareLine
                        label={t("booking.fareBookingFee")}
                        value={fare.bookingFee}
                        currency={fare.currency}
                      />
                    )}
                    {fare.serviceFee > 0 && (
                      <FareLine
                        label={t("booking.fareServiceFee")}
                        value={fare.serviceFee}
                        currency={fare.currency}
                      />
                    )}
                    <div className="my-1 border-t border-neutral-200 dark:border-neutral-700" />
                    <FareLine
                      label={t("booking.fareTotal")}
                      value={fare.total}
                      currency={fare.currency}
                      emphasize
                    />
                  </CardContent>
                </Card>
              );
            })()}

          <Button
            onClick={() => void handleConfirm()}
            isLoading={confirming}
            disabled={!selectedCategoryId || scheduleMode === "later"}
            className="self-start"
          >
            {t("booking.confirmBooking")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** One line of the itemized fare breakdown — real `FareBreakdown` fields only, no invented values. */
function FareLine({
  label,
  value,
  currency,
  emphasize,
}: {
  label: string;
  value: number;
  currency: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span
        className={
          emphasize
            ? "font-semibold text-neutral-900 dark:text-neutral-50"
            : "text-neutral-500 dark:text-neutral-400"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasize
            ? "font-semibold text-neutral-900 dark:text-neutral-50"
            : "text-neutral-700 dark:text-neutral-300"
        }
      >
        {value.toFixed(2)} {currency}
      </span>
    </div>
  );
}

// BOOKING-01 fix — useSearchParams() (used above to read the homepage
// handoff) requires a Suspense boundary for static export; same pattern as
// LoginPage/VerifyEmailPage.
export default function BookRidePage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<LoadingState title={t("common.loading")} />}>
      <BookRidePageContent />
    </Suspense>
  );
}
