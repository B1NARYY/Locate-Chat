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

const messagesDiv = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", () => {
  console.log("WebSocket connected");
});

socket.addEventListener("message", async (event) => {
  try {
    const jsonString = event.data instanceof Blob ? await event.data.text() : event.data;
    const msg = JSON.parse(jsonString);

    if (msg.type === "room_deleted" && parseInt(msg.roomId) === parseInt(roomId)) {
      showRoomDeletedOverlay();
      return;
    }

    if (msg.type === "location") return;

    if (msg.chat_room_id == roomId && msg.sender_username !== username && msg.content) {
      appendMessage({
        sender_username: msg.sender_username,
        content: msg.content
      });
    }
  } catch (err) {
    console.error("WebSocket error:", err);
  }
});

messageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = messageInput.value.trim();
  if (!content) return;

  const msg = {
    chat_room_id: roomId,
    sender_username: username,
    content,
    latitude: null,
    longitude: null
  };

  try {
    const res = await fetch(`${API}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });

    if (res.ok) {
      appendMessage(msg);
      messageInput.value = "";
    } else {
      console.error("Message send failed");
    }
  } catch (err) {
    console.error("Send error:", err);
  }
});

async function loadMessages() {
  try {
    const res = await fetch(`${API}/api/messages/room/${roomId}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;
    messagesDiv.innerHTML = "";
    data.forEach(msg => appendMessage(msg));
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } catch (err) {
    console.error("Loading messages failed:", err);
  }
}

function appendMessage({ sender_username, content }) {
  const el = document.createElement("div");
  el.classList.add("message");
  el.classList.add(sender_username === username ? "my-message" : "other-message");
  el.innerHTML = `<strong>${sender_username}</strong>: ${content}`;
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

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
      <p>You will be redirected to the rooms page in 5 seconds...</p>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    window.location.href = "index.html";
  }, 5000); // 5 sekund
}


async function showRoomCode() {
  try {
    const res = await fetch(`${API}/api/chatrooms/${roomId}`);
    if (!res.ok) return;
    const room = await res.json();
    if (room.code) {
      const codeEl = document.createElement("p");
      codeEl.id = "room-code";
      codeEl.style.fontSize = "0.9em";
      codeEl.style.color = "#555";
      codeEl.style.textAlign = "center";
      codeEl.textContent = `Room code: ${room.code}`;
      document.getElementById("room-name")?.after(codeEl);
    }
  } catch (err) {
    console.error("Failed to load room code:", err);
  }
}

// Init
window.addEventListener("load", async () => {
  await loadMessages();
  await maybeShowDeleteButton();
  await showRoomCode();
});
