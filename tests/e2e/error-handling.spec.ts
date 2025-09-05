import { test, expect } from '@playwright/test';

test.describe('Error Handling E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');
    
    // Esperar a que la aplicación cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('should handle backend server offline', async ({ page }) => {
    // Interceptar y fallar todas las peticiones al backend
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Intentar enviar mensaje
    await messageInput.fill('Mensaje de prueba');
    await sendButton.click();
    
    // Verificar que aparece mensaje de error
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/error|conexión|servidor/i);
    
    // Verificar que el botón se vuelve a habilitar
    await expect(sendButton).toBeEnabled();
  });

  test('should handle network timeout', async ({ page }) => {
    // Interceptar peticiones y simular timeout
    await page.route('**/api/ai/stream', route => {
      // Simular timeout no respondiendo
      setTimeout(() => {
        route.abort('timedout');
      }, 5000);
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje que causará timeout');
    await sendButton.click();
    
    // Esperar mensaje de error por timeout
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
    await expect(errorMessage).toContainText(/timeout|tiempo|espera/i);
  });

  test('should handle server error responses', async ({ page }) => {
    // Interceptar y devolver error 500
    await page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error', message: 'Something went wrong' })
      });
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje que causará error 500');
    await sendButton.click();
    
    // Verificar mensaje de error
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/error|servidor/i);
  });

  test('should handle malformed streaming response', async ({ page }) => {
    // Interceptar y devolver respuesta malformada
    await page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'invalid sse format\nno proper events'
      });
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje con respuesta malformada');
    await sendButton.click();
    
    // Verificar manejo de error
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should handle request abortion', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const stopButton = page.locator('[data-testid="stop-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    
    // Interceptar para simular respuesta lenta
    await page.route('**/api/ai/stream', route => {
      // Simular respuesta lenta que puede ser abortada
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'event: token\ndata: {"token": "Respuesta"}\n\n'
        });
      }, 2000);
    });
    
    // Enviar mensaje
    await messageInput.fill('Mensaje para abortar');
    await sendButton.click();
    
    // Verificar que aparece botón de stop
    await expect(stopButton).toBeVisible({ timeout: 1000 });
    
    // Abortar la petición
    await stopButton.click();
    
    // Verificar que el botón de envío se vuelve a habilitar
    await expect(sendButton).toBeEnabled();
    
    // Verificar que desaparece el botón de stop
    await expect(stopButton).toBeHidden();
  });

  test('should handle API rate limiting', async ({ page }) => {
    // Interceptar y devolver error 429 (Too Many Requests)
    await page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: {
          'Retry-After': '60'
        },
        body: JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again later.' 
        })
      });
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje que causará rate limit');
    await sendButton.click();
    
    // Verificar mensaje de error específico para rate limiting
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/límite|rate|intentar|más tarde/i);
  });

  test('should handle authentication errors', async ({ page }) => {
    // Interceptar y devolver error 401 (Unauthorized)
    await page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invalid API key or authentication failed' 
        })
      });
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje con error de autenticación');
    await sendButton.click();
    
    // Verificar mensaje de error de autenticación
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/autenticación|autorización|clave|api/i);
  });

  test('should handle empty or invalid streaming response', async ({ page }) => {
    // Interceptar y devolver respuesta vacía
    await page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: ''
      });
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje con respuesta vacía');
    await sendButton.click();
    
    // Verificar manejo de respuesta vacía
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    await expect(errorMessage).toContainText(/respuesta|vacía|error/i);
  });

  test('should retry failed requests', async ({ page }) => {
    let requestCount = 0;
    
    // Interceptar y fallar las primeras 2 peticiones, luego permitir
    await page.route('**/api/ai/stream', route => {
      requestCount++;
      if (requestCount <= 2) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'event: token\ndata: {"token": "Respuesta exitosa después de reintentos"}\n\nevent: done\ndata: {}\n\n'
        });
      }
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const retryButton = page.locator('[data-testid="retry-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje para probar reintentos');
    await sendButton.click();
    
    // Verificar que aparece botón de reintentar
    await expect(retryButton).toBeVisible({ timeout: 10000 });
    
    // Reintentar
    await retryButton.click();
    
    // Verificar que aparece botón de reintentar nuevamente
    await expect(retryButton).toBeVisible({ timeout: 10000 });
    
    // Reintentar una vez más (debería funcionar)
    await retryButton.click();
    
    // Verificar que finalmente se recibe la respuesta
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
    await expect(messagesContainer.locator('.message-assistant').last()).toContainText('Respuesta exitosa');
  });

  test('should handle concurrent request errors', async ({ page }) => {
    // Interceptar y devolver errores para múltiples peticiones
    await page.route('**/api/ai/stream', route => {
      route.abort('failed');
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    
    // Enviar múltiples mensajes rápidamente
    await messageInput.fill('Primer mensaje');
    await sendButton.click();
    
    // Esperar un poco y enviar otro
    await page.waitForTimeout(500);
    await messageInput.fill('Segundo mensaje');
    await sendButton.click();
    
    // Verificar que se manejan ambos errores
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verificar que el sistema sigue funcional
    await expect(sendButton).toBeEnabled();
  });

  test('should handle browser offline state', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    
    // Simular estado offline
    await page.context().setOffline(true);
    
    // Verificar indicador offline (si existe)
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible();
    }
    
    // Intentar enviar mensaje offline
    await messageInput.fill('Mensaje offline');
    await sendButton.click();
    
    // Verificar que se maneja el estado offline
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Restaurar conexión
    await page.context().setOffline(false);
    
    // Verificar que el indicador offline desaparece
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeHidden({ timeout: 5000 });
    }
  });

  test('should clear errors when new successful request is made', async ({ page }) => {
    let shouldFail = true;
    
    // Interceptar - fallar primero, luego permitir
    await page.route('**/api/ai/stream', route => {
      if (shouldFail) {
        shouldFail = false;
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'event: token\ndata: {"token": "Respuesta exitosa"}\n\nevent: done\ndata: {}\n\n'
        });
      }
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    
    // Enviar mensaje que fallará
    await messageInput.fill('Mensaje que fallará');
    await sendButton.click();
    
    // Verificar error
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Enviar mensaje exitoso
    await messageInput.fill('Mensaje exitoso');
    await sendButton.click();
    
    // Verificar que el error se limpia y aparece respuesta
    await expect(errorMessage).toBeHidden({ timeout: 10000 });
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
  });
});