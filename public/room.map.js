const map = L.map('map').setView([50.0755, 14.4378], 13); // Default: Prague

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Leaflet | © OpenStreetMap contributors'
}).addTo(map);

// Custom icons
const blueIcon = new L.Icon({
  iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const redIcon = new L.Icon({
  iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const locationMarkers = {};
let autoShareInterval = null;

const shareLocationBtn = document.getElementById("share-location-btn");
const autoShareBtn = document.getElementById("auto-share-btn");

function shareLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      // Remove previous marker if exists
      if (locationMarkers[username]) {
        map.removeLayer(locationMarkers[username]);
      }

      // Add new marker
      const marker = L.marker([latitude, longitude], { icon: blueIcon })
        .addTo(map)

      locationMarkers[username] = marker;
      map.setView([latitude, longitude], 13);

      // Send location to others
      const locationMsg = {
        type: "location",
        chat_room_id: roomId,
        sender_username: username,
        latitude,
        longitude
      };

      socket.send(JSON.stringify(locationMsg));
    },
    () => {
      alert("Unable to retrieve your location.");
    }
  );
}

shareLocationBtn?.addEventListener("click", shareLocation);

autoShareBtn?.addEventListener("click", () => {
  if (autoShareInterval) {
    // Stop sharing
    clearInterval(autoShareInterval);
    autoShareInterval = null;
    autoShareBtn.classList.remove("active");
    autoShareBtn.textContent = "Auto-Share";
  } else {
    // Start sharing
    shareLocation(); // Share immediately once
    autoShareInterval = setInterval(shareLocation, 5000);
    autoShareBtn.classList.add("active");
    autoShareBtn.textContent = "Stop Auto-Share";
  }
});

socket.addEventListener("message", async (event) => {
  try {
    const jsonString = event.data instanceof Blob ? await event.data.text() : event.data;
    const msg = JSON.parse(jsonString);

    if (
      msg.type === "location" &&
      msg.chat_room_id == roomId &&
      msg.sender_username !== username
    ) {
      const { latitude, longitude, sender_username } = msg;

      if (locationMarkers[sender_username]) {
        map.removeLayer(locationMarkers[sender_username]);
      }

      const marker = L.marker([latitude, longitude], { icon: redIcon })
        .addTo(map)
        .bindPopup(`${sender_username}'s location`)
        .bindTooltip(sender_username, {
          permanent: true,
          direction: "top",
          offset: [0, -10],
          className: "username-tooltip"
        });

      locationMarkers[sender_username] = marker;
    }
  } catch (err) {
    console.error("Map socket parse error:", err);
  }
});
