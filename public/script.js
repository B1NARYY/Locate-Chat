const API_BASE = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const pathname = window.location.pathname;

  const allowedPages = ["login.html", "register.html"];
  const isAuthPage = allowedPages.some(p => pathname.endsWith(p));

  if ((!token || !username) && !isAuthPage) {
    window.location.href = "login.html";
    return;
  }

  const currentUserEl = document.getElementById("current-user");
  if (currentUserEl) currentUserEl.textContent = username || "Unknown";

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "login.html";
    });
  }

  // Přihlášení
  const loginButton = document.getElementById('login');
  if (loginButton) {
    loginButton.addEventListener('click', async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password_hash: password }),
        });

        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', username);
          window.location.href = 'index.html';
        } else {
          showMessage(data.message || 'Login failed.');
        }
      } catch (err) {
        console.error('Login error:', err);
        showMessage('Login failed. Please try again.');
      }
    });
  }

  // Registrace
  const registerButton = document.getElementById('register');
  if (registerButton) {
    registerButton.addEventListener('click', async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      if (!username || !password) {
        showMessage('Username and Password are required.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          showMessage(data.message || 'Registration failed.');
        } else {
          showMessage('Registration successful. Redirecting...', false);
          setTimeout(() => window.location.href = "login.html", 1500);
        }
      } catch (err) {
        console.error('Registration error:', err);
        showMessage('Registration failed. Please try again.');
      }
    });
  }

  // Načíst veřejné místnosti
  const chatroomsList = document.getElementById('chatrooms');
  if (chatroomsList) {
    fetchChatRooms();
  }

  async function fetchChatRooms() {
    try {
      const res = await fetch(`${API_BASE}/api/chatrooms`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Invalid chatrooms response:", data);
        return;
      }

      chatroomsList.innerHTML = '';

      data.forEach(room => {
        if (!room.is_public) return;

        const li = document.createElement('li');
        li.innerHTML = `<strong>${room.name}</strong><br><small>Code: ${room.code || 'N/A'}</small>`;
        li.dataset.id = room.id;
        li.addEventListener('click', () => {
          window.location.href = `room.html?id=${room.id}&name=${encodeURIComponent(room.name)}`;
        });
        chatroomsList.appendChild(li);
      });
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    }
  }

  // Vytvořit místnost
  const createRoomBtn = document.getElementById('create-room-btn');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', async () => {
      const roomNameInput = document.getElementById('new-room-name');
      const privacySelect = document.getElementById('room-privacy');

      if (!roomNameInput || !privacySelect) {
        alert("Missing input elements for room creation.");
        return;
      }

      const roomName = roomNameInput.value.trim();
      const isPublic = privacySelect.value === "public";

      if (!roomName) {
        alert('Please enter a room name.');
        return;
      }

      try {
        const username = localStorage.getItem("username");
        const resUser = await fetch(`${API_BASE}/api/users/by-username/${username}`);
        const userData = await resUser.json();

        if (!userData?.id) {
          alert("User not found.");
          return;
        }

        const res = await fetch(`${API_BASE}/api/chatrooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: roomName,
            owner_id: userData.id,
            is_public: isPublic ? 1 : 0,
            profanity_filter: false
          })
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('Non-200 response:', text);
          alert('Room creation failed');
          return;
        }

        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          return alert('Invalid server response');
        }

        const roomId = data.roomId;
        const encodedName = encodeURIComponent(roomName);
        if (!isPublic && data.code) {
          alert(`Private room created. Access code: ${data.code}`);
        }
        window.location.href = `room.html?id=${roomId}&name=${encodedName}`;
      } catch (err) {
        console.error('Error creating room:', err);
        alert('Error creating room.');
      }
    });
  }

  // Připojení pomocí kódu
  const joinByCodeBtn = document.getElementById("join-room-btn");
  if (joinByCodeBtn) {
    joinByCodeBtn.addEventListener("click", async () => {
      const codeInput = document.getElementById("room-code-input");
      const code = codeInput?.value?.trim();
      if (!code) return alert("Please enter a code.");

      try {
        const res = await fetch(`${API_BASE}/api/chatrooms`);
        const data = await res.json();
        const room = data.find(r => r.code === code);
        if (!room) return alert("No room with this code found.");

        window.location.href = `room.html?id=${room.id}&name=${encodeURIComponent(room.name)}`;
      } catch (err) {
        console.error("Join by code error:", err);
        alert("Join failed.");
      }
    });
  }

  function showMessage(msg, isError = true) {
    const box = document.getElementById('message');
    if (box) {
      box.textContent = msg;
      box.style.color = isError ? 'red' : 'green';
    }
  }
});

async function loadMyRooms() {
  const username = localStorage.getItem("username");
  if (!username) {
    console.warn("Username is missing in localStorage.");
    return;
  }

  try {
    console.log("Calling loadMyRooms for:", username);

    const resUser = await fetch(`${API_BASE}/api/users/by-username/${username}`);
    const user = await resUser.json();

    if (!user || !user.id) {
      console.warn("User not found or has no ID:", user);
      return;
    }

    const resRooms = await fetch(`${API_BASE}/api/chatrooms`);
    const allRooms = await resRooms.json();

    const myRooms = allRooms.filter(room => room.owner_id === user.id);
    console.log("My rooms:", myRooms);

    const list = document.getElementById("my-room-list");
    if (!list) {
      console.warn("Element with ID 'my-room-list' not found in HTML.");
      return;
    }

    list.innerHTML = "";

    myRooms.forEach(room => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${room.name} (${room.is_public ? "public" : "private"})</span>
        <button class="delete-room-btn" data-id="${room.id}">&times;</button>
      `;
      list.appendChild(li);
    });

    document.querySelectorAll(".delete-room-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Delete this room?")) {
          const res = await fetch(`${API_BASE}/api/chatrooms/${id}`, { method: "DELETE" });
          if (res.ok) {
            location.reload(); // reload whole page
          } else {
            alert("Failed to delete room.");
          }
        }
      });
    });
  } catch (err) {
    console.error("Error loading your rooms:", err);
  }
}

window.addEventListener("load", async () => {
  await loadMyRooms();
});

