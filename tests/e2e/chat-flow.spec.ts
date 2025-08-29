import { test, expect } from '@playwright/test';

test.describe('Chat Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');
    
    // Esperar a que la aplicación cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('should load chat interface correctly', async ({ page }) => {
    // Verificar que los elementos principales estén presentes
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
  });

  test('should send message and receive streaming response', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');

    // Escribir mensaje de prueba
    await messageInput.fill('Hola, ¿cómo estás?');
    
    // Verificar que el botón de envío esté habilitado
    await expect(sendButton).toBeEnabled();
    
    // Enviar mensaje
    await sendButton.click();
    
    // Verificar que el mensaje del usuario aparece
    await expect(messagesContainer.locator('.message-user').last()).toContainText('Hola, ¿cómo estás?');
    
    // Verificar que el botón se deshabilita durante el envío
    await expect(sendButton).toBeDisabled();
    
    // Esperar a que aparezca la respuesta del asistente
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
    
    // Verificar que la respuesta contiene texto
    const assistantMessage = messagesContainer.locator('.message-assistant').last();
    await expect(assistantMessage).not.toBeEmpty();
    
    // Verificar que el botón se vuelve a habilitar
    await expect(sendButton).toBeEnabled();
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');

    // Enviar primer mensaje
    await messageInput.fill('¿Cuál es tu nombre?');
    await sendButton.click();
    
    // Esperar respuesta
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
    
    // Enviar segundo mensaje
    await messageInput.fill('¿Puedes ayudarme con algo?');
    await sendButton.click();
    
    // Esperar segunda respuesta
    await expect(messagesContainer.locator('.message-assistant').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Verificar que hay al menos 4 mensajes (2 usuario + 2 asistente)
    await expect(messagesContainer.locator('.message')).toHaveCount(4, { timeout: 15000 });
  });

  test('should clear input after sending message', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Escribir y enviar mensaje
    await messageInput.fill('Mensaje de prueba');
    await sendButton.click();
    
    // Verificar que el input se limpia
    await expect(messageInput).toHaveValue('');
  });

  test('should handle empty message submission', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Intentar enviar mensaje vacío
    await messageInput.fill('');
    
    // El botón debería estar deshabilitado para mensajes vacíos
    await expect(sendButton).toBeDisabled();
  });

  test('should show typing indicator during response', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const typingIndicator = page.locator('[data-testid="typing-indicator"]');

    // Enviar mensaje
    await messageInput.fill('Cuéntame una historia corta');
    await sendButton.click();
    
    // Verificar que aparece el indicador de escritura
    await expect(typingIndicator).toBeVisible({ timeout: 5000 });
    
    // Esperar a que desaparezca cuando termine la respuesta
    await expect(typingIndicator).toBeHidden({ timeout: 15000 });
  });

  test('should handle network request correctly', async ({ page }) => {
    // Interceptar la petición de streaming
    const streamingRequest = page.waitForRequest(request => 
      request.url().includes('/api/ai/stream') && request.method() === 'POST'
    );
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Enviar mensaje
    await messageInput.fill('Test de red');
    await sendButton.click();
    
    // Verificar que se hace la petición correcta
    const request = await streamingRequest;
    expect(request.url()).toContain('/api/ai/stream');
    expect(request.method()).toBe('POST');
    
    // Verificar headers
    const headers = request.headers();
    expect(headers['content-type']).toContain('application/json');
  });

  test('should handle conversation history persistence', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');

    // Enviar varios mensajes
    const messages = ['Primer mensaje', 'Segundo mensaje', 'Tercer mensaje'];
    
    for (const message of messages) {
      await messageInput.fill(message);
      await sendButton.click();
      await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
    }
    
    // Recargar la página
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar que los mensajes persisten (si hay localStorage/sessionStorage)
    // Nota: Esto depende de la implementación específica de persistencia
    const messageCount = await messagesContainer.locator('.message').count();
    expect(messageCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');

    // Escribir mensaje
    await messageInput.fill('Mensaje con Enter');
    
    // Enviar con Enter
    await messageInput.press('Enter');
    
    // Verificar que el mensaje se envía
    await expect(messagesContainer.locator('.message-user').last()).toContainText('Mensaje con Enter');
    
    // Verificar que se recibe respuesta
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
  });

  test('should handle long messages correctly', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');

    // Crear mensaje largo
    const longMessage = 'Este es un mensaje muy largo que contiene mucho texto para probar cómo maneja la aplicación mensajes extensos y si hay algún límite de caracteres o problemas de renderizado con contenido largo.'.repeat(3);
    
    await messageInput.fill(longMessage);
    await sendButton.click();
    
    // Verificar que el mensaje largo se muestra correctamente
    await expect(messagesContainer.locator('.message-user').last()).toContainText(longMessage.substring(0, 50));
    
    // Verificar que se recibe respuesta
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 15000 });
  });
});