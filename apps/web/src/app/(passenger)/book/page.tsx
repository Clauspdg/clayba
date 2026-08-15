"use client";

import { webFirestore } from "@/lib/firebase-client";
import { estimateFareForCategory, estimateRoute } from "@/lib/fare-estimate";
import {
  createTripRequest,
  getGlobalSettings,
  subscribeFavoritePlaces,
} from "@the-ride/firebase/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Heading,
  Illustration,
  LoadingState,
  Select,
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const CURRENT_LOCATION = "current-location";

export default function BookRidePage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);
  const [categories, setCategories] = useState<VehicleCategory[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pickupChoice, setPickupChoice] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [destinationChoice, setDestinationChoice] = useState("");
  const [stopChoices, setStopChoices] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!session) return;
    const unsubPlaces = subscribeFavoritePlaces(webFirestore, session.uid, setPlaces, setLoadError);
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
      unsubPlaces();
      unsubCategories();
    };
  }, [session]);

  function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast({ variant: "danger", title: t("savedPlaces.geolocationUnsupported") });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setPickupChoice(CURRENT_LOCATION);
        setLocating(false);
      },
      () => {
        toast({ variant: "danger", title: t("savedPlaces.geolocationDenied") });
        setLocating(false);
      },
    );
  }

  function resolveLocation(choice: string): GeoLocation | null {
    if (choice === CURRENT_LOCATION) {
      return currentLocation
        ? {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: t("booking.currentLocation"),
          }
        : null;
    }
    const place = places?.find((p) => p.id === choice);
    return place ? { lat: place.lat, lng: place.lng, address: place.address } : null;
  }

  const pickup = resolveLocation(pickupChoice);
  const dropoff = resolveLocation(destinationChoice);
  const stops = stopChoices.map(resolveLocation).filter((loc): loc is GeoLocation => loc !== null);

  const route = useMemo(() => {
    if (!pickup || !dropoff) return null;
    return estimateRoute([pickup, ...stops, dropoff]);
  }, [pickup, dropoff, stops]);

  const fareByCategory = useMemo(() => {
    if (!route || !settings || !categories) return null;
    return new Map(
      categories.map((category) => [
        category.id,
        estimateFareForCategory(route, category, settings),
      ]),
    );
  }, [route, settings, categories]);

  function addStop() {
    setStopChoices([...stopChoices, ""]);
  }

  function updateStop(index: number, value: string) {
    setStopChoices(stopChoices.map((s, i) => (i === index ? value : s)));
  }

  function removeStop(index: number) {
    setStopChoices(stopChoices.filter((_, i) => i !== index));
  }

  async function handleConfirm() {
    if (!session || !pickup || !dropoff || !selectedCategoryId || !fareByCategory || !route) return;
    const fareEstimate = fareByCategory.get(selectedCategoryId);
    if (!fareEstimate) return;

    setConfirming(true);
    try {
      await createTripRequest(webFirestore, {
        passengerId: session.uid,
        pickup,
        dropoff,
        stops,
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

  if (places === null || categories === null) {
    return <LoadingState title={t("common.loading")} />;
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Heading level={2}>{t("passengerNav.bookRide")}</Heading>
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("booking.noPlacesTitle")}
          description={t("booking.noPlacesDescription")}
          action={
            <Button asChild>
              <Link href="/saved-places">{t("passengerNav.savedPlaces")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const placeOptions = places.map((p) => ({ value: p.id, label: p.label }));
  const pickupOptions = [
    { value: CURRENT_LOCATION, label: t("booking.useCurrentLocation") },
    ...placeOptions,
  ];

  return (
    <div className="flex flex-col gap-6">
      <Heading level={2}>{t("passengerNav.bookRide")}</Heading>
      {loadError && <p className="text-danger text-sm">{loadError}</p>}

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <Select
            label={t("booking.pickupLabel")}
            placeholder={t("booking.selectPlace")}
            value={pickupChoice}
            onValueChange={(value) =>
              value === CURRENT_LOCATION ? handleUseCurrentLocation() : setPickupChoice(value)
            }
            options={pickupOptions}
          />
          {locating && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {t("common.loading")}
            </span>
          )}

          <Select
            label={t("booking.destinationLabel")}
            placeholder={t("booking.selectPlace")}
            value={destinationChoice}
            onValueChange={setDestinationChoice}
            options={placeOptions}
          />

          {stopChoices.map((stop, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <Select
                  label={`${t("booking.stopLabel")} ${index + 1}`}
                  placeholder={t("booking.selectPlace")}
                  value={stop}
                  onValueChange={(value) => updateStop(index, value)}
                  options={placeOptions}
                />
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeStop(index)}>
                {t("common.delete")}
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addStop} className="self-start">
            {t("booking.addStop")}
          </Button>
        </CardContent>
      </Card>

      {route && fareByCategory && (
        <div className="flex flex-col gap-4">
          <Heading level={3}>{t("booking.chooseVehicleTitle")}</Heading>
          <div className="tablet:grid-cols-2 laptop:grid-cols-3 grid gap-4">
            {categories.map((category) => {
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

          <Button
            onClick={() => void handleConfirm()}
            isLoading={confirming}
            disabled={!selectedCategoryId}
            className="self-start"
          >
            {t("booking.confirmBooking")}
          </Button>
        </div>
      )}
    </div>
  );
}
