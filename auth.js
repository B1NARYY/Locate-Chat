const API = 'http://localhost:3000';
const msgBox = document.getElementById('message');

function showMessage(text, error = true) {
  msgBox.textContent = text;
  msgBox.style.color = error ? 'red' : 'green';
}

if (document.getElementById('login-form')) {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password_hash: password })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      window.location.href = 'index.html';
    } else {
      showMessage(data.message || 'Login failed');
    }
  });
}

if (document.getElementById('register-form')) {
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch(`${API}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      showMessage('Registration successful. You can now login.', false);
      setTimeout(() => (window.location.href = 'login.html'), 1000);
    } else {
      showMessage(data.message || 'Registration failed');
    }
  });
}
