# API de Reingresos - Backend

API REST para gestión de reingresos usando **Google Sheets** como base de datos.

## 🚀 Características

- ✅ **CRUD completo** (Create, Read, Update, Delete)
- 📊 **Google Sheets** como base de datos
- 🔒 **Autenticación** con cuenta de servicio de Google
- 🌐 **CORS** habilitado para frontend
- 📝 **Validación** de datos y manejo de errores
- 🔄 **Hot reload** con nodemon

## 📋 Requisitos previos

1. **Node.js** (v16 o superior)
2. **Yarn** package manager
3. **Cuenta de Google** con acceso a Google Sheets API
4. **Cuenta de servicio** de Google Cloud

## ⚙️ Configuración

### 1. Instalar dependencias
```bash
yarn install
```

### 2. Configurar cuenta de servicio de Google

#### a) Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google Sheets API**

#### b) Crear cuenta de servicio
1. Ve a **IAM & Admin** > **Service Accounts**
2. Clic en **Create Service Account**
3. Asigna un nombre (ej: `reingresos-sheets-api`)
4. Descarga el archivo JSON de credenciales

#### c) Configurar permisos en Google Sheets
1. Abre tu Google Sheet
2. Clic en **Share** (Compartir)
3. Agrega el email de la cuenta de servicio con permisos de **Editor**
4. Copia el **ID del spreadsheet** desde la URL

### 3. Variables de entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Edita `.env`:
```env
# Credenciales de Google (JSON completo de la cuenta de servicio)
GOOGLE_ACCOUNT_JSON={"type":"service_account","project_id":"tu-proyecto",...}

# ID y nombre del Google Sheet
SPREADSHEET_ID=1ABC123DEF456...  # ID de tu Google Sheet
SPREADSHEET_NAME=Hoja 1          # Nombre de la hoja

# Configuración del servidor
PORT=4000                        # Puerto del servidor
NODE_ENV=development             # Entorno de ejecución
```

## 🏃‍♂️ Ejecutar la aplicación

### Desarrollo (con hot reload)
```bash
yarn dev
```

### Producción
```bash
yarn start
```

La API estará disponible en `http://localhost:3000`

## 📚 Endpoints de la API

### Información general
- **GET** `/` - Información de la API y endpoints disponibles

### Gestión de items
- **GET** `/api/items` - Obtener todos los items
- **GET** `/api/items/:id` - Obtener item por ID
- **POST** `/api/items` - Crear nuevo item
- **PUT** `/api/items/:id` - Actualizar item existente
- **DELETE** `/api/items/:id` - Eliminar item

## 📝 Formato de datos

### Estructura de respuesta
```json
{
  "success": true,
  "data": { /* datos */ },
  "message": "Mensaje descriptivo"
}
```

### Ejemplo de item
```json
{
  "id": "1699123456789",
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "fecha_reingreso": "2024-01-15",
  "departamento": "Ventas",
  "estado": "Activo"
}
```

## 🗂️ Estructura del proyecto

```
reingresos-back/
├── src/
│   ├── index.js          # Servidor principal
│   ├── sheetsService.js  # Servicio para Google Sheets
│   └── routes/
│       └── items.js      # Rutas CRUD para items
├── package.json          # Dependencias y scripts
├── .env.example         # Variables de entorno de ejemplo
└── README.md           # Esta documentación
```

## 🔧 Estructura de Google Sheets

Tu Google Sheet debe tener **headers en la primera fila**. Ejemplo:

| id | nombre | email | fecha_reingreso | departamento | estado |
|----|--------|-------|----------------|--------------|---------|
| 1699123456789 | Juan Pérez | juan@example.com | 2024-01-15 | Ventas | Activo |

## 🐛 Solución de problemas

### Error: "GOOGLE_ACCOUNT_JSON not set"
- Verifica que la variable esté configurada en `.env`
- Asegúrate de que el JSON sea válido y esté en una sola línea

### Error: "SPREADSHEET_ID not set"
- Configura el ID del spreadsheet en `.env`
- Copia el ID desde la URL de Google Sheets

### Error de permisos
- Verifica que la cuenta de servicio tenga permisos de **Editor** en el Google Sheet
- Revisa que la Google Sheets API esté habilitada en Google Cloud Console

## 🛠️ Tecnologías utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Google APIs** - Cliente para Google Sheets API
- **CORS** - Manejo de solicitudes cross-origin
- **dotenv** - Gestión de variables de entorno
- **nodemon** - Hot reload en desarrollo

## 📄 Licencia

MIT License