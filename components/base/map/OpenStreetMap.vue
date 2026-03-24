<template>
  <UModal
    v-model:open="isOpen"
    class="max-w-6xl"
    overlay
    :ui="{ footer: '!py-2.5 w-full justify-center', body: '!p-0' }"
    :dismissible="false"
  >
    <template #header>
      <div class="flex w-full items-end space-x-2">
        <UFormField class="w-full">
          <template #label>
            Pin
            <UIcon class="align-top text-[#dc3545]" size="20" name="i-mdi-map-marker" />
            to locate your location
          </template>
          <UInput
            v-model="searchQuery"
            type="text"
            :placeholder="`Latitude, Longitude (eg. ${defaultLocation.lat}, ${defaultLocation.lng})`"
            size="lg"
            class="w-full flex-1"
            :disabled="isSearching"
            @keyup.enter="searchLocation"
          />
        </UFormField>
        <UButton
          icon="i-heroicons-magnifying-glass"
          size="lg"
          variant="solid"
          color="primary"
          :loading="isSearching"
          :disabled="isSearching || !searchQuery.trim()"
          @click="searchLocation"
        >
          Search
        </UButton>
      </div>
    </template>
    <template #body>
      <div class="relative h-[450px] w-full overflow-hidden rounded p-0 md:h-[600px]">
        <ClientOnly>
          <BaseMapLoader :is-loading="isMapLoading" />
          <!-- Current Location Button -->
          <div class="absolute right-3 bottom-10 z-10 flex flex-col space-y-2">
            <UTooltip text="Current Location">
              <UButton
                icon="i-heroicons-map-pin-20-solid"
                size="lg"
                variant="ghost"
                :loading="isGettingLocation"
                :disabled="isGettingLocation"
                class="shadow-primary-soft"
                @click="goToCurrentLocation"
              />
            </UTooltip>
          </div>
          <div id="map" ref="mapContainer" class="h-full w-full"></div>
          <template #fallback>
            <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">
              <div class="flex flex-col items-center space-y-3">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl" />
                <p>Loading map...</p>
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center space-x-4">
          <UFormField label="Latitude">
            <UInput
              v-model="inputLat"
              :disabled="isSearching || isGettingLocation"
              type="text"
              placeholder="Latitude"
              size="lg"
              @update:model-value="updateMarkerFromInput"
            />
          </UFormField>
          <UFormField label="Longitude">
            <UInput
              v-model="inputLng"
              :disabled="isSearching || isGettingLocation"
              type="text"
              placeholder="Longitude"
              size="lg"
              @update:model-value="updateMarkerFromInput"
            />
          </UFormField>
        </div>
        <div class="flex items-center space-x-2">
          <UButton
            variant="soft"
            color="neutral"
            class="rounded-md px-6 py-2"
            :disabled="isSearching || isGettingLocation"
            @click="isOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            type="button"
            variant="solid"
            color="primary"
            class="rounded-md px-6 py-2"
            :disabled="isSearching || isGettingLocation"
            @click="selectLocation"
          >
            Confirm Location
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { customIcon } from "~/constants";

const props = defineProps({
  latLongValue: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:latLongValue"]);

const isOpen = defineModel<boolean>("is-open", { default: false });

const toast = useToast();

const defaultLocation = { lat: 11.562108, lng: 104.888535 };
const center = ref({ lat: defaultLocation.lat, lng: defaultLocation.lng });
const zoom = ref(10);
const inputLat = ref<string | undefined>(center.value.lat.toString());
const inputLng = ref<string | undefined>(center.value.lng.toString());
const searchQuery = ref<string>("");
const isSearching = ref(false);
const isMapLoading = ref(true);
const isGettingLocation = ref(false);

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;
let currentLocationMarker: any = null;

if (typeof props.latLongValue === "string") {
  const normalized = props.latLongValue.replace(", ", " ");
  const [latStr, lngStr] = normalized.split(" ");
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (!isNaN(lat) && !isNaN(lng)) {
    inputLat.value = lat.toFixed(6);
    inputLng.value = lng.toFixed(6);
    center.value = { lat, lng };
  }
}

const initMap = () => {
  if (!mapContainer.value || map) return;
  isMapLoading.value = true;
  try {
    setTimeout(() => {
      if (!mapContainer.value) return;
      map = L.map(mapContainer.value, {
        preferCanvas: true,
        zoomControl: true,
        attributionControl: false,
      }).setView([center.value.lat, center.value.lng], zoom.value);

      const tileLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19, crossOrigin: true }
      );

      let tilesLoading = 0;
      let tilesLoaded = 0;
      tileLayer.on("tileloadstart", () => { tilesLoading++; });
      tileLayer.on("tileload", () => {
        tilesLoaded++;
        if (tilesLoaded >= tilesLoading && tilesLoading > 0) {
          setTimeout(() => { isMapLoading.value = false; }, 200);
        }
      });
      tileLayer.on("tileerror", () => { tilesLoaded++; });
      setTimeout(() => { isMapLoading.value = false; }, 3000);
      tileLayer.addTo(map);

      marker = L.marker([center.value.lat, center.value.lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);
      marker.on("dragend", (event) => {
        const position = event.target.getLatLng();
        inputLat.value = position.lat.toFixed(6);
        inputLng.value = position.lng.toFixed(6);
      });
      map.on("click", (event) => {
        const { lat, lng } = event.latlng;
        inputLat.value = lat.toFixed(6);
        inputLng.value = lng.toFixed(6);
        updateMarker(lat, lng);
      });

      setTimeout(() => map?.invalidateSize(), 100);
      setTimeout(() => map?.invalidateSize(), 300);
      setTimeout(() => map?.invalidateSize(), 500);
    }, 50);
  } catch (error) {
    console.error("Error initializing map:", error);
    isMapLoading.value = false;
    toast.add({ title: "Error", description: "Failed to initialize map", color: "error" });
  }
};

const updateMarker = (lat: number, lng: number) => {
  if (marker && map) {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom());
  }
};

const updateMarkerFromInput = () => {
  const lat = parseFloat(inputLat.value || "");
  const lng = parseFloat(inputLng.value || "");
  if (!isNaN(lat) && !isNaN(lng)) {
    center.value = { lat, lng };
    updateMarker(lat, lng);
  }
};

const getUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        center.value = { lat: userLat, lng: userLng };
        inputLat.value = userLat.toFixed(6);
        inputLng.value = userLng.toFixed(6);
        if (map) {
          map.setView([userLat, userLng], 15);
          updateMarker(userLat, userLng);
        }
      },
      (error) => {
        console.error("Error getting user's location:", error);
        inputLat.value = center.value.lat.toString();
        inputLng.value = center.value.lng.toString();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  } else {
    inputLat.value = center.value.lat.toString();
    inputLng.value = center.value.lng.toString();
  }
};

const goToCurrentLocation = () => {
  if (!navigator.geolocation) {
    toast.add({ title: "Error", description: "Geolocation is not supported by your browser", color: "error" });
    return;
  }
  isGettingLocation.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      center.value = { lat: userLat, lng: userLng };
      inputLat.value = userLat.toFixed(6);
      inputLng.value = userLng.toFixed(6);
      if (map) {
        map.flyTo([userLat, userLng], 16, { duration: 1.5 });
        updateMarker(userLat, userLng);
        if (currentLocationMarker) map.removeLayer(currentLocationMarker);
        currentLocationMarker = L.circleMarker([userLat, userLng], {
          radius: 8,
          fillColor: "#3b82f6",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);
        setTimeout(() => {
          if (currentLocationMarker && map) {
            map.removeLayer(currentLocationMarker);
            currentLocationMarker = null;
          }
        }, 3000);
      }
      isGettingLocation.value = false;
      toast.add({ title: "Success", description: "Located your current position", color: "success" });
    },
    (error) => {
      console.error("Error getting current location:", error);
      isGettingLocation.value = false;
      let errorMessage = "Unable to get your location";
      if (error.code === error.PERMISSION_DENIED) errorMessage = "Location permission denied. Please enable location access.";
      else if (error.code === error.POSITION_UNAVAILABLE) errorMessage = "Location information is unavailable.";
      else if (error.code === error.TIMEOUT) errorMessage = "Location request timed out.";
      toast.add({ title: "Error", description: errorMessage, color: "error" });
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

const searchLocation = async () => {
  if (!searchQuery.value.trim()) {
    toast.add({ title: "Error", description: "Please enter a location to search", color: "warning" });
    return;
  }
  isSearching.value = true;
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=1`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) throw new Error("Search request failed");
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const formattedAddress = data[0].display_name;
      center.value = { lat, lng };
      inputLat.value = lat.toFixed(6);
      inputLng.value = lng.toFixed(6);
      if (map) {
        map.flyTo([lat, lng], 15, { duration: 1.5 });
        updateMarker(lat, lng);
      }
      toast.add({
        title: "Success",
        description: formattedAddress.length > 80 ? formattedAddress.substring(0, 80) + "..." : formattedAddress,
        color: "success",
      });
    } else {
      toast.add({ title: "Not Found", description: "No results found for your search", color: "warning" });
    }
  } catch (error) {
    console.error("Error during geocoding:", error);
    toast.add({ title: "Error", description: "Error searching location", color: "error" });
  } finally {
    isSearching.value = false;
  }
};

watch(isOpen, (newValue) => {
  if (newValue) {
    isMapLoading.value = true;
    nextTick(() => {
      setTimeout(() => {
        initMap();
        if (!props.latLongValue) getUserLocation();
      }, 150);
    });
  } else {
    if (map) {
      map.remove();
      map = null;
      marker = null;
      currentLocationMarker = null;
    }
    isMapLoading.value = true;
  }
});

watch(
  () => props.latLongValue,
  (newVal) => {
    if (!newVal || typeof newVal !== "string") return;
    const normalized = newVal.replace(", ", " ");
    const [latStr, lngStr] = normalized.split(" ");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return;
    inputLat.value = lat.toFixed(6);
    inputLng.value = lng.toFixed(6);
    center.value = { lat, lng };
    if (map) {
      map.setView([lat, lng], 15);
      updateMarker(lat, lng);
    }
  },
  { immediate: true }
);

const selectLocation = () => {
  const finalLat = parseFloat(inputLat.value || "");
  const finalLng = parseFloat(inputLng.value || "");
  if (!isNaN(finalLat) && !isNaN(finalLng)) {
    emit("update:latLongValue", `${finalLat.toFixed(6)}, ${finalLng.toFixed(6)}`);
    isOpen.value = false;
  } else {
    toast.add({ title: "Error", description: "Invalid latitude or longitude", color: "error" });
  }
};

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
    marker = null;
    currentLocationMarker = null;
    isMapLoading.value = false;
  }
});
</script>

<style scoped>
#map {
  z-index: 0;
}
</style>
