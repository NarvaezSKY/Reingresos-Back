import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import itemsRoutes from './routes/items.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar formato de Morgan según el entorno
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

// Configuración de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://reingresos-front.vercel.app'
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'], // Para desarrollo local
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(morgan(morganFormat)); // Logging de peticiones HTTP - 'dev' para desarrollo, 'combined' para producción
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/items', itemsRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Reingresos - Conectado a Google Sheets',
    version: '1.0.0',
    endpoints: {
      'GET /api/items': 'Obtener todos los items',
      'GET /api/items/stats': 'Obtener estadísticas del sheet',
      'GET /api/items/:id': 'Obtener item por ID', 
      'POST /api/items': 'Crear nuevo item (ID se genera automáticamente)',
      'PUT /api/items/:id': 'Actualizar item',
      'DELETE /api/items/:id': 'Eliminar item'
    },
    features: {
      'ID automático': 'Los IDs se generan automáticamente con formato R{timestamp}{random}',
      'Validación de ID': 'Se verifica que no existan IDs duplicados',
      'Mapeo dinámico': 'Las columnas del sheet se mapean automáticamente'
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 API de Reingresos conectada a Google Sheets`);
  console.log(`🌐 Visita http://localhost:${PORT} para ver info de la API`);
  console.log(`📝 Logging activado con Morgan (formato: ${morganFormat})`);
});

export default app;