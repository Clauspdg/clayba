"use client";

import { webFirestore } from "@/lib/firebase-client";
import {
  addFavoritePlace,
  deleteFavoritePlace,
  subscribeFavoritePlaces,
} from "@the-ride/firebase/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Heading,
  Illustration,
  Input,
  LoadingState,
  useToast,
  useTranslation,
} from "@the-ride/ui";
import { useAuth } from "@the-ride/hooks";
import type { FavoritePlace } from "@the-ride/types";
import { useEffect, useState } from "react";

export default function SavedPlacesPage() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { toast } = useToast();
  const [places, setPlaces] = useState<FavoritePlace[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    return subscribeFavoritePlaces(webFirestore, session.uid, setPlaces, setError);
  }, [session]);

  function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      toast({ variant: "danger", title: t("savedPlaces.geolocationUnsupported") });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      () => {
        toast({ variant: "danger", title: t("savedPlaces.geolocationDenied") });
        setLocating(false);
      },
    );
  }

  function openAdd() {
    setLabel("");
    setAddress("");
    setCoords(null);
    setAdding(true);
  }

  async function handleSave() {
    if (!session || !coords) return;
    setSaving(true);
    try {
      await addFavoritePlace(webFirestore, session.uid, {
        label,
        address,
        lat: coords.lat,
        lng: coords.lng,
      });
      toast({ variant: "success", title: t("savedPlaces.added") });
      setAdding(false);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(placeId: string) {
    if (!session) return;
    setBusyId(placeId);
    try {
      await deleteFavoritePlace(webFirestore, session.uid, placeId);
    } catch (err) {
      toast({ variant: "danger", title: err instanceof Error ? err.message : t("common.error") });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={2}>{t("passengerNav.savedPlaces")}</Heading>
        <Button onClick={openAdd}>{t("savedPlaces.addPlace")}</Button>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {t("savedPlaces.description")}
      </p>

      {error ? (
        <ErrorState title={t("admin.emptyStates.errorTitle")} description={error} />
      ) : places === null ? (
        <LoadingState title={t("common.loading")} />
      ) : places.length === 0 ? (
        <EmptyState
          icon={<Illustration name="empty" size={80} />}
          title={t("savedPlaces.noPlaces")}
        />
      ) : (
        <ul className="tablet:grid-cols-2 grid gap-3">
          {places.map((place) => (
            <li
              key={place.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-50">{place.label}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{place.address}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                isLoading={busyId === place.id}
                onClick={() => void handleDelete(place.id)}
              >
                {t("common.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle>{t("savedPlaces.addPlace")}</DialogTitle>
            <DialogDescription>{t("savedPlaces.addPlaceDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              label={t("savedPlaces.labelField")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("savedPlaces.labelPlaceholder")}
            />
            <Input
              label={t("savedPlaces.addressField")}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("savedPlaces.addressPlaceholder")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              isLoading={locating}
            >
              {t("savedPlaces.useCurrentLocation")}
            </Button>
            {coords && (
              <p className="text-success text-sm">
                {t("savedPlaces.locationCaptured")} ({coords.lat.toFixed(4)},{" "}
                {coords.lng.toFixed(4)})
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => void handleSave()}
              isLoading={saving}
              disabled={!label.trim() || !address.trim() || !coords}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
