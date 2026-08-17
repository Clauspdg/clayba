"use client";

import { webFirestore } from "@/lib/firebase-client";
import { estimateFareForCategory, estimateRoute } from "@/lib/fare-estimate";
import { getMapProvider } from "@/lib/map-provider";
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
  Input,
  LoadingState,
  RadioGroupField,
  Select,
  TimePicker,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type {
  FavoritePlace,
  GeoLocation,
  PlatformSettings,
  VehicleCategory,
} from "@the-ride/types";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface AddressFieldState {
  text: string;
  location: GeoLocation | null;
  busy: boolean;
  error: string | null;
}

const EMPTY_ADDRESS: AddressFieldState = { text: "", location: null, busy: false, error: null };
const PASSENGER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function BookRidePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);
  const [categories, setCategories] = useState<VehicleCategory[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pickup, setPickup] = useState<AddressFieldState>(EMPTY_ADDRESS);
  const [destination, setDestination] = useState<AddressFieldState>(EMPTY_ADDRESS);
  const [stops, setStops] = useState<AddressFieldState[]>([]);
  const [locating, setLocating] = useState(false);

  const [passengerCount, setPassengerCount] = useState(1);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

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
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
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
      (err) => setLoadError(err.message),
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

  const route = useMemo(() => {
    if (!pickup.location || !destination.location) return null;
    return estimateRoute([pickup.location, ...stopLocations, destination.location]);
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
        vehicleCategoryId: selectedCategoryId,
        estimatedDistanceMeters: route.distanceMeters,
        estimatedDurationSeconds: route.durationSeconds,
        fareEstimate,
      });
      toast({ variant: "success", title: t("booking.confirmed") });
      router.push("/rides");
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
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

  if (categories === null) {
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
            <div className="tablet:flex-row tablet:items-end flex flex-col gap-2">
              <div className="flex-1">
                <Input
                  label={t("booking.pickupLabel")}
                  placeholder={t("booking.pickupPlaceholder")}
                  value={pickup.text}
                  errorText={pickup.error ?? undefined}
                  helperText={pickup.busy ? t("booking.locatingLabel") : undefined}
                  onChange={(e) =>
                    setPickup((prev) => ({ ...prev, text: e.target.value, error: null }))
                  }
                  onBlur={(e) => void resolveManualAddress(e.target.value, setPickup)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void resolveManualAddress(pickup.text, setPickup);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                isLoading={locating}
                className="tablet:w-auto w-full"
              >
                {t("booking.useCurrentLocation")}
              </Button>
            </div>
            {renderSavedPlaceChips(setPickup)}
          </div>

          <div className="flex flex-col gap-2">
            <Input
              label={t("booking.destinationLabel")}
              placeholder={t("booking.destinationPlaceholder")}
              value={destination.text}
              errorText={destination.error ?? undefined}
              helperText={destination.busy ? t("booking.locatingLabel") : undefined}
              onChange={(e) =>
                setDestination((prev) => ({ ...prev, text: e.target.value, error: null }))
              }
              onBlur={(e) => void resolveManualAddress(e.target.value, setDestination)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void resolveManualAddress(destination.text, setDestination);
              }}
            />
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
          <Button variant="outline" size="sm" onClick={addStop} className="self-start">
            {t("booking.addStop")}
          </Button>

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
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <TimePicker
                  label={t("booking.scheduledTimeLabel")}
                  value={scheduledTime}
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

      {route && fareByCategory && (
        <div className="flex flex-col gap-4">
          <Heading level={3}>{t("booking.chooseVehicleTitle")}</Heading>
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
                          {fare ? `$${fare.total.toFixed(2)}` : "—"}
                        </span>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          )}

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
