# Barbería Prime

Sistema web para gestión de reservas de peluquería con autenticación de usuarios y panel de administración.

## Características

- Sistema de registro e inicio de sesión
- Reserva de citas
- Panel de administración
- Diseño moderno y responsivo
- Base de datos SQLite

## Requisitos

- Node.js (v14 o superior)
- npm (v6 o superior)

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd barberia-prime
```

2. Instalar dependencias del backend:
```bash
cd backend
npm install
```

3. Configurar la base de datos:
```bash
npm run setup-db
```

4. Iniciar el servidor:
```bash
npm start
```

5. Para el frontend, simplemente abre el archivo `frontend/index.html` en tu navegador.

## Estructura del Proyecto

```
barberia-prime/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   └── database.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   └── index.html
└── README.md
```

## Usuarios por Defecto

### Administrador
- Email: admin@barberia.com
- Contraseña: admin123

### Usuario Normal
- Email: usuario@ejemplo.com
- Contraseña: usuario123

## Contribuir

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request 