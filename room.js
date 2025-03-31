// room.js

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("id");
const roomName = urlParams.get("name");
const API = "http://localhost:3000";

document.getElementById("room-name").textContent = roomName;

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

const messagesDiv = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

const locationBtn = document.getElementById("share-location-btn");
const mapDiv = document.getElementById("map");

let map, markerGroup;

window.onload = async () => {
  if (!roomId || !roomName || !username) {
    alert("Missing room ID, name, or user.");
    return;
  }

  await loadMessages();
  initMap();
  await loadLocations();
};

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = messageInput.value;
  if (!message.trim()) return;

  try {
    const res = await fetch(`${API}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_room_id: roomId,
        sender_username: username,
        content: message,
        latitude: null,
        longitude: null,
      }),
    });

    if (res.ok) {
      messageInput.value = "";
      await loadMessages();
    } else {
      console.error("Message send failed");
    }
  } catch (err) {
    console.error("Send error:", err);
  }
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    try {
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_room_id: roomId,
          sender_username: username,
          content: "[Location shared]",
          latitude,
          longitude,
        }),
      });

      if (res.ok) {
        await loadMessages();
        await loadLocations();
      } else {
        console.error("Location message failed");
      }
    } catch (err) {
      console.error("Location error:", err);
    }
  });
});

async function loadMessages() {
  try {
    const res = await fetch(`${API}/api/messages/room/${roomId}`);
    const data = await res.json();
    messagesDiv.innerHTML = "";

    data.forEach((msg) => {
      const el = document.createElement("div");

      if (msg.latitude && msg.longitude) {
        el.innerHTML = `<strong>${msg.sender_id}</strong>: <a href="https://maps.google.com/?q=${msg.latitude},${msg.longitude}" target="_blank">📍 Shared location</a>`;
      } else {
        el.textContent = `${msg.sender_id}: ${msg.content}`;
      }

      messagesDiv.appendChild(el);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } catch (err) {
    console.error("Loading messages failed:", err);
  }
}

function initMap() {
  map = L.map("map").setView([50.08, 14.43], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  markerGroup = L.layerGroup().addTo(map);
}

async function loadLocations() {
  try {
    const res = await fetch(`${API}/api/messages/room/${roomId}`);
    const data = await res.json();

    markerGroup.clearLayers();

    data.forEach((msg) => {
      if (msg.latitude && msg.longitude) {
        const marker = L.marker([msg.latitude, msg.longitude])
          .bindPopup(`User ${msg.sender_id}`);
        markerGroup.addLayer(marker);
      }
    });
  } catch (err) {
    console.error("Loading locations failed:", err);
  }
}
