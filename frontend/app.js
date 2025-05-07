// Animación entre login y registro
const authWrapper = document.getElementById('auth-wrapper');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const authBg = document.getElementById('auth-bg');
const mainBg = document.getElementById('main-bg');

showRegister.onclick = () => {
  authWrapper.classList.add('show-register');
};
showLogin.onclick = () => {
  authWrapper.classList.remove('show-register');
};

// Navegación entre secciones
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.main-section');
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    sections.forEach(sec => sec.style.display = 'none');
    const id = link.getAttribute('href').replace('#', '');
    document.getElementById(id).style.display = 'block';
    if (id === 'admin') cargarReservasAdmin();
  });
});

// Conexión con backend
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://tu-backend-url.com/api'; // Reemplaza esto con la URL de tu backend en producción

// Registro
const registerForm = document.getElementById('register-form');
registerForm.onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  let telefono = document.getElementById('register-telefono').value;
  const password = document.getElementById('register-password').value;
  // Validar teléfono
  if (!/^\+591\d{8}$/.test(telefono)) {
    alert('El teléfono debe comenzar con +591 y tener 8 dígitos');
    return;
  }
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, telefono })
    });
    const data = await res.json();
    if (data.success) {
      alert('¡Registro exitoso! Ahora inicia sesión.');
      authWrapper.classList.remove('show-register');
      registerForm.reset();
    } else {
      alert(data.error || 'Error al registrar');
    }
  } catch (err) {
    alert('Error de conexión');
  }
};

// Login
const loginForm = document.getElementById('login-form');
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      await mostrarMain();
      loginForm.reset();
    } else {
      alert(data.error || 'Error al iniciar sesión');
    }
  } catch (err) {
    alert('Error de conexión');
  }
};

// Mostrar página principal si hay token
async function mostrarMain() {
  authBg.style.display = 'none';
  mainBg.style.display = 'flex';
  await cargarPerfil();
  await mostrarOpcionesAdmin();
}

// Cerrar sesión
const logoutBtn = document.getElementById('logout-btn');
logoutBtn.onclick = () => {
  localStorage.removeItem('token');
  mainBg.style.display = 'none';
  authBg.style.display = 'flex';
};

// Mantener sesión si hay token
window.onload = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Verifica el token llamando a /api/profile
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { 'authorization': token }
      });
      if (res.ok) {
        await mostrarMain();
      } else {
        localStorage.removeItem('token');
      }
    } catch {
      localStorage.removeItem('token');
    }
  }
};

// Perfil de usuario
const profileBtn = document.getElementById('profile-btn');
const profilePanel = document.getElementById('profile-panel');
const profileImg = document.getElementById('profile-img');
const profileImgBig = document.getElementById('profile-img-big');
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');
const profileTelefono = document.getElementById('profile-telefono');
const profileImgInput = document.getElementById('profile-img-input');

profileBtn.onclick = () => {
  profilePanel.classList.toggle('active');
};
document.addEventListener('click', (e) => {
  if (!profilePanel.contains(e.target) && !profileBtn.contains(e.target)) {
    profilePanel.classList.remove('active');
  }
});

let usuarioActual = null;
async function cargarPerfil() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/profile`, {
      headers: { 'authorization': token }
    });
    if (res.ok) {
      const user = await res.json();
      usuarioActual = user;
      profileUsername.textContent = user.username;
      profileEmail.textContent = user.email;
      profileTelefono.textContent = user.telefono;
      profileImg.src = user.fotoPerfil;
      profileImgBig.src = user.fotoPerfil;
    }
  } catch {}
}

// Cambiar foto de perfil
profileImgInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(evt) {
    const base64 = evt.target.result;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/profile/foto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': token
      },
      body: JSON.stringify({ fotoPerfil: base64 })
    });
    if (res.ok) {
      await cargarPerfil();
      alert('Foto de perfil actualizada');
    } else {
      alert('Error al actualizar la foto');
    }
  };
  reader.readAsDataURL(file);
});

// Mostrar opciones de admin si corresponde
document.getElementById('admin-nav-item').style.display = 'none';
async function mostrarOpcionesAdmin() {
  if (usuarioActual && usuarioActual.isAdmin) {
    document.getElementById('admin-nav-item').style.display = 'inline-block';
  } else {
    document.getElementById('admin-nav-item').style.display = 'none';
  }
}

// Guardar reservas en backend (usuarios normales)
const reservaForm = document.getElementById('reserva-form');
const reservasLista = document.getElementById('reservas-lista');
let reservas = [];
if (reservaForm) {
  reservaForm.onsubmit = async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-reserva').value;
    const fecha = document.getElementById('fecha-reserva').value;
    const servicio = document.getElementById('servicio-reserva').value;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token
        },
        body: JSON.stringify({ nombre, fecha, servicio })
      });
      const data = await res.json();
      if (data.success) {
        alert('Reserva guardada correctamente');
        reservaForm.reset();
      } else {
        alert(data.error || 'Error al guardar la reserva');
      }
    } catch {
      alert('Error de conexión');
    }
  };
}

// Panel de administración: ver todas las reservas
async function cargarReservasAdmin() {
  const token = localStorage.getItem('token');
  const adminLista = document.getElementById('admin-reservas-lista');
  if (!token || !usuarioActual || !usuarioActual.isAdmin) {
    adminLista.innerHTML = 'No autorizado.';
    return;
  }
  adminLista.innerHTML = 'Cargando...';
  try {
    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: { 'authorization': token }
    });
    if (res.ok) {
      const reservas = await res.json();
      if (reservas.length === 0) {
        adminLista.innerHTML = '<em>No hay reservas registradas.</em>';
      } else {
        adminLista.innerHTML = reservas.map(r =>
          `<div class="admin-reserva-item">
            <b>${r.nombre}</b> reservó <b>${r.servicio}</b> para <b>${new Date(r.fecha).toLocaleString()}</b><br>
            <span class="admin-user-info">Usuario: ${r.username} | Email: ${r.email} | Tel: ${r.telefono}</span>
          </div>`
        ).join('');
      }
    } else {
      adminLista.innerHTML = 'Error al cargar reservas.';
    }
  } catch {
    adminLista.innerHTML = 'Error de conexión.';
  }
} 