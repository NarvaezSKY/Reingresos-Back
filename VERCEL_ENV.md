# ⚠️ IMPORTANTE: Variables de entorno para producción

## Variables requeridas en Vercel:

### 1. GOOGLE_ACCOUNT_JSON
```
Valor: El JSON completo de tu cuenta de servicio de Google (el mismo que tienes en .env)
```

### 2. SPREADSHEET_ID  
```
Valor: 1w8k6lsoPf5KvmzKB2P_o9G3LGezpcu15bJUkXkxtSlg
```

### 3. SPREADSHEET_NAME
```
Valor: Hoja 1
```

### 4. NODE_ENV
```
Valor: production
```

### 5. PORT (opcional)
```
Valor: 4000
Nota: Vercel manejará el puerto automáticamente
```

## 🔐 Configurar en Vercel Dashboard:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor correspondiente
4. Asegúrate de que estén disponibles para "Production", "Preview" y "Development"

## ⚡ Redeploy después de configurar variables:
```bash
# En Vercel dashboard:
Deployments → ... → Redeploy
```

## 🔍 Verificar configuración:
Después del despliegue, visita:
```
https://tu-proyecto.vercel.app/
```

Deberías ver la información de la API con todos los endpoints.