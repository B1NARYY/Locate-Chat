import { loadMessages, appendMessage, initMessageForm } from "./room.chat.js";
import "./room.map.js";


const roomId = new URLSearchParams(window.location.search).get("id");
const roomName = new URLSearchParams(window.location.search).get("name");
const API = "http://localhost:3000";
const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token || !username || !roomId || !roomName) {
  alert("You must be logged in to access the chat room.");
  window.location.href = "login.html";
}

document.getElementById("room-name").textContent = roomName;
document.getElementById("current-user").textContent = username;

const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", () => {
  console.log("WebSocket connected");
});

socket.addEventListener("message", (event) => {
  try {
    const msg = JSON.parse(event.data);

    if (msg.type === "room_deleted" && parseInt(msg.roomId) === parseInt(roomId)) {
      showRoomDeletedOverlay();
      return;
    }

    if (msg.chat_room_id == roomId) {
      appendMessage({
        sender_username: msg.sender_username || "Unknown",
        content: msg.content
      }, username);
    }
  } catch (err) {
    console.error("WebSocket error:", err);
  }
});

async function isCurrentUserRoomOwner() {
  try {
    const res = await fetch(`${API}/api/chatrooms`);
    const rooms = await res.json();
    const room = rooms.find(r => r.id == roomId);
    if (!room) return false;

    const userRes = await fetch(`${API}/api/users/by-username/${username}`);
    const user = await userRes.json();
    return room.owner_id === user.id;
  } catch {
    return false;
  }
}

async function maybeShowDeleteButton() {
  if (await isCurrentUserRoomOwner()) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete Room";
    deleteBtn.id = "delete-room-btn";
    deleteBtn.style.marginTop = "10px";
    deleteBtn.style.backgroundColor = "#c62828";
    deleteBtn.style.color = "white";
    deleteBtn.style.border = "none";
    deleteBtn.style.padding = "8px 12px";
    deleteBtn.style.cursor = "pointer";

    document.querySelector(".chat-panel")?.appendChild(deleteBtn);

    deleteBtn.addEventListener("click", async () => {
      if (confirm("Do you really want to delete this room?")) {
        try {
          const res = await fetch(`${API}/api/chatrooms/${roomId}`, {
            method: "DELETE"
          });
          if (res.ok) {
            socket.send(JSON.stringify({ type: "room_deleted", roomId }));
            alert("Room deleted");
            window.location.href = "index.html";
          } else {
            alert("Failed to delete room.");
          }
        } catch (err) {
          alert("Delete error");
        }
      }
    });
  }
}

function showRoomDeletedOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.innerHTML = `
    <div class="modal">
      <h3>This room was deleted</h3>
      <p>You will be redirected to the rooms page.</p>
      <button id="go-back">Go to Rooms</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("go-back").onclick = () => window.location.href = "index.html";
}

async function showRoomCode() {
  try {
    const res = await fetch(`${API}/api/chatrooms/${roomId}`);
    if (!res.ok) return;
    const room = await res.json();
    if (room.code) {
      const codeEl = document.getElementById("room-code");
      if (codeEl) codeEl.textContent = `Room code: ${room.code}`;
    }
  } catch (err) {
    console.error("Failed to load room code:", err);
  }
}

// === INIT ===
window.addEventListener("load", async () => {
  await loadMessages(roomId, username);
  initMessageForm(roomId, username, socket);
  await maybeShowDeleteButton();
  await showRoomCode();
});
