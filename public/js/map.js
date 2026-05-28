window.addEventListener("load", function () {

  const coords = window.coordinates || [77.2090, 28.6139];

  const lng = coords[0] ?? 77.2090;
  const lat = coords[1] ?? 28.6139;

  const map = L.map("map").setView([lat, lng], 13);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(window.locationText)
    .openPopup();

});