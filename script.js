const API_BASE = 'http://localhost:3000';

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const loginButton = document.getElementById('login');
const registerButton = document.getElementById('register');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const messageBox = document.getElementById('message');
const chatroomsList = document.getElementById('chatrooms');
const createRoomBtn = document.getElementById('create-room-btn');
const newRoomNameInput = document.getElementById('new-room-name');

function showMessage(msg, isError = true) {
  messageBox.textContent = msg;
  messageBox.style.color = isError ? 'red' : 'green';
}

loginButton.addEventListener('click', async () => {
  const username = usernameInput.value;
  const password = passwordInput.value;

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
      loginContainer.style.display = 'none';
      chatContainer.style.display = 'block';
      fetchChatRooms();
      showMessage('Login successful', false);
    } else {
      showMessage(data.message || 'Login failed.');
    }
  } catch (err) {
    console.error('Login error:', err);
    showMessage('Login failed. Please try again.');
  }
});

registerButton.addEventListener('click', async () => {
  const username = usernameInput.value;
  const password = passwordInput.value;

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
      showMessage('Registration successful. You can now log in.', false);
    }
  } catch (err) {
    console.error('Registration error:', err);
    showMessage('Registration failed. Please try again.');
  }
});

async function fetchChatRooms() {
  try {
    const res = await fetch(`${API_BASE}/api/chatrooms`);
    const chatrooms = await res.json();
    chatroomsList.innerHTML = '';
    chatrooms.forEach(room => {
      const roomElement = document.createElement('li');
      roomElement.textContent = room.name;
      roomElement.dataset.id = room.id;
      roomElement.addEventListener('click', () => {
        window.location.href = `room.html?id=${room.id}&name=${encodeURIComponent(room.name)}`;
      });
      chatroomsList.appendChild(roomElement);
    });
  } catch (err) {
    console.error('Error fetching chat rooms:', err);
  }
}

createRoomBtn.addEventListener('click', async () => {
  const roomName = newRoomNameInput.value.trim();
  if (!roomName) {
    alert('Please enter a room name.');
    return;
  }

  try {
    const username = localStorage.getItem("username");
    const resUser = await fetch(`${API_BASE}/api/users/by-username/${username}`);
    const userData = await resUser.json();

    const res = await fetch(`${API_BASE}/api/chatrooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roomName,
        owner_id: userData.id,
        is_public: true,
        profanity_filter: false
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Room created!');
      newRoomNameInput.value = '';
      fetchChatRooms();
    } else {
      alert(data.message || 'Room creation failed');
    }
  } catch (err) {
    console.error('Error creating room:', err);
    alert('Error creating room.');
  }
});

// Auto-load if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  if (token && username) {
    loginContainer.style.display = 'none';
    chatContainer.style.display = 'block';
    fetchChatRooms();
  }
});
