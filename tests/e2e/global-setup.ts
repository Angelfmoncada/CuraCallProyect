import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup para las pruebas E2E
 * Se ejecuta una vez antes de todas las pruebas
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando configuración global de pruebas E2E...');
  
  // Verificar que los servidores estén disponibles
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Verificar backend
    console.log('🔍 Verificando backend en http://localhost:5000...');
    const backendResponse = await page.request.get('http://localhost:5000/api/ai/health');
    if (!backendResponse.ok()) {
      throw new Error(`Backend no disponible: ${backendResponse.status()}`);
    }
    console.log('✅ Backend disponible');
    
    // Verificar frontend
    console.log('🔍 Verificando frontend en http://localhost:5173...');
    const frontendResponse = await page.request.get('http://localhost:5173');
    if (!frontendResponse.ok()) {
      throw new Error(`Frontend no disponible: ${frontendResponse.status()}`);
    }
    console.log('✅ Frontend disponible');
    
  } catch (error) {
    console.error('❌ Error en configuración global:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Configuración global completada');
}

export default globalSetup;