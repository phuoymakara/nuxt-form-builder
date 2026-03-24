import L from "leaflet";

export const customIcon = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" style="color:#ef4444;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))">
    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.608 3.5-7.077 0-4.142-3.358-7.5-7.5-7.5s-7.5 3.358-7.5 7.5c0 2.47 1.556 5.065 3.5 7.077a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});
