<template>
  <div class="relative h-full w-full">
    <BaseMapLoader :is-loading="isLoading" />
    <ClientOnly>
      <div ref="mapContainer" class="h-full w-full" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { customIcon } from "~/constants";

const props = defineProps({
  center: {
    type: Object as PropType<{ lat: number; lng: number }>,
    default: () => ({ lat: 11.568427, lng: 104.891796 })
  },
  zoom: {
    type: Number,
    default: 10
  },
  markers: {
    type: Array as PropType<Array<{ position: { lat: number; lng: number }; title?: string }>>,
    default: () => []
  }
});

const emit = defineEmits(["mapClick", "beforeLoad", "mapLoaded"]);

const mapContainer = ref<HTMLElement | null>(null);
const isLoading = ref(true);
let map: L.Map | null = null;
let markerInstances: L.Marker[] = [];

const initMap = () => {
  if (!mapContainer.value || map) return;
  emit("beforeLoad");
  // Initialize the map
  map = L.map(mapContainer.value, {
    fadeAnimation: true,
    zoomAnimation: true,
    attributionControl: false
  }).setView([props.center.lat, props.center.lng], props.zoom);
  // Add OpenStreetMap tile layer with loading options
  const tileLayer = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
      keepBuffer: 4, // Keep more tiles in memory
      updateWhenIdle: false, // Load tiles while panning
      updateWhenZooming: false, // Don't load tiles while zooming
      bounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180))
    }
  ).addTo(map);
  let tilesLoaded = false;
  tileLayer.once("load", () => {
    isLoading.value = false;
    emit("mapLoaded");
    // 🔑 CRITICAL FIX
    nextTick(() => {
      setTimeout(() => {
        map?.invalidateSize(true);
      }, 100);
    });
  });

  map.on("click", (event) => {
    const { lat, lng } = event.latlng;
    emit("mapClick", { lat, lng });
  });
  // Add markers
  updateMarkers();
  // Fallback: remove loading after 2 seconds if tiles don't load
  setTimeout(() => {
    if (isLoading.value && !tilesLoaded) {
      tilesLoaded = true;
      isLoading.value = false;
      emit("mapLoaded");
    }
  }, 2000);
};

const updateMarkers = () => {
  if (!map) return;
  // Clear existing markers
  markerInstances.forEach((marker) => marker.remove());
  markerInstances = [];
  // Add new markers
  props.markers.forEach((markerData) => {
    const marker = L.marker([markerData.position.lat, markerData.position.lng], {
      title: markerData.title,
      icon: customIcon
    }).addTo(map!);
    markerInstances.push(marker);
  });
};

// Watch for center changes
watch(
  () => props.center,
  (newCenter) => {
    if (map) {
      map.setView([newCenter.lat, newCenter.lng], map.getZoom());
    }
  },
  { deep: true }
);

// Watch for zoom changes
watch(
  () => props.zoom,
  (newZoom) => {
    if (map) {
      map.setZoom(newZoom);
    }
  }
);

// Watch for marker changes
watch(
  () => props.markers,
  () => {
    updateMarkers();
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    initMap();
  });
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
    markerInstances = [];
  }
});
</script>

<style lang="css" scoped>
#map {
  z-index: 0;
}
</style>
