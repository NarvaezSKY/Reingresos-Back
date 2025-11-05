import express from 'express';
import { listItems, getItemById, createItem, updateItem, deleteItem, getStats } from '../sheetsService.js';

const router = express.Router();

// GET /api/items/stats - Obtener estadísticas del sheet
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json({
      success: true,
      data: stats,
      message: 'Estadísticas del Google Sheet obtenidas exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del Google Sheet',
      message: error.message
    });
  }
});

// GET /api/items - Obtener todos los items
router.get('/', async (req, res) => {
  try {
    const items = await listItems();
    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Error al obtener items:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener items de Google Sheets',
      message: error.message
    });
  }
});

// GET /api/items/:id - Obtener item por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await getItemById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado',
        message: `No se encontró item con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error al obtener item:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener item de Google Sheets',
      message: error.message
    });
  }
});

// POST /api/items - Crear nuevo item
router.post('/', async (req, res) => {
  try {
    const newItem = req.body;
    
    if (!newItem || Object.keys(newItem).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const createdItem = await createItem(newItem);
    
    res.status(201).json({
      success: true,
      data: createdItem,
      message: 'Item creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear item:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear item en Google Sheets',
      message: error.message
    });
  }
});

// PUT /api/items/:id - Actualizar item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        message: 'El cuerpo de la petición no puede estar vacío'
      });
    }

    const updatedItem = await updateItem(id, updateData);
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado',
        message: `No se encontró item con ID: ${id}`
      });
    }

    res.json({
      success: true,
      data: updatedItem,
      message: 'Item actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar item:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar item en Google Sheets',
      message: error.message
    });
  }
});

// DELETE /api/items/:id - Eliminar item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteItem(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Item no encontrado',
        message: `No se encontró item con ID: ${id}`
      });
    }

    res.json({
      success: true,
      message: `Item con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar item de Google Sheets',
      message: error.message
    });
  }
});

export default router;