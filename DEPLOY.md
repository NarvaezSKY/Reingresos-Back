# 🚀 Despliegue en Vercel

## Pasos para desplegar la API en Vercel

### 1. Preparar el repositorio
```bash
# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .

# Hacer commit
git commit -m "Initial commit - Reingresos API"

# Conectar con GitHub
git remote add origin https://github.com/TU_USUARIO/reingresos-api.git
git push -u origin main
```

### 2. Configurar variables de entorno en Vercel

Una vez conectado tu repo a Vercel, configura estas variables:

**Variables requeridas:**
- `GOOGLE_ACCOUNT_JSON`: El JSON completo de credenciales de Google
- `SPREADSHEET_ID`: ID de tu Google Sheet
- `SPREADSHEET_NAME`: Nombre de la hoja (ej: "Hoja 1")
- `PORT`: 4000 (opcional, Vercel lo manejará automáticamente)
- `NODE_ENV`: production

### 3. Comando de despliegue local (opcional)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### 4. URLs de la API desplegada
- **Base URL**: `https://tu-proyecto.vercel.app`
- **Endpoints**:
  - `GET /` - Información de la API
  - `GET /api/items` - Obtener todos los reingresos
  - `GET /api/items/stats` - Estadísticas del sheet
  - `GET /api/items/:id` - Obtener por ID
  - `POST /api/items` - Crear reingreso
  - `PUT /api/items/:id` - Actualizar reingreso
  - `DELETE /api/items/:id` - Eliminar reingreso

### 5. Probar la API desplegada
```bash
# Probar que funciona
curl https://tu-proyecto.vercel.app/

# Obtener todos los items
curl https://tu-proyecto.vercel.app/api/items

# Crear un nuevo item
curl -X POST https://tu-proyecto.vercel.app/api/items \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test User","email":"test@example.com"}'
```

## ⚙️ Configuración incluida

### vercel.json
- ✅ Configurado para Node.js con ES Modules
- ✅ CORS habilitado
- ✅ Timeout de 30 segundos para Google Sheets
- ✅ Región optimizada (iad1)

### .gitignore
- ✅ Archivos de entorno (.env)
- ✅ Credenciales de Google
- ✅ node_modules
- ✅ Logs y archivos temporales
- ✅ Archivos de IDE

## 🔧 Troubleshooting

### Error de timeout
Si tienes errores de timeout, aumenta `maxDuration` en `vercel.json`

### Error de CORS
Los headers de CORS ya están configurados en `vercel.json`

### Error de variables de entorno
Verifica que todas las variables estén configuradas en el dashboard de Vercel

## 📱 Frontend connection
Una vez desplegada, usa la URL de Vercel en tu frontend en lugar de `localhost:4000`