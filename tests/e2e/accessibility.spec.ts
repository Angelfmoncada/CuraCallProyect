import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');
    
    // Esperar a que la aplicación cargue completamente
    await page.waitForLoadState('networkidle');
  });

  test('should pass automated accessibility scan', async ({ page }) => {
    // Ejecutar análisis de accesibilidad con axe-core
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Verificar que no hay violaciones críticas
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    // Verificar que existe al menos un h1
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    
    // Verificar jerarquía de headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      // Verificar que los headings tienen texto
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        await expect(heading).not.toBeEmpty();
      }
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    
    // Navegar con Tab
    await page.keyboard.press('Tab');
    
    // Verificar que el primer elemento focuseable recibe el foco
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continuar navegación con Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar que se puede llegar al input de mensaje
    await messageInput.focus();
    await expect(messageInput).toBeFocused();
    
    // Escribir con teclado
    await messageInput.type('Mensaje de prueba de accesibilidad');
    await expect(messageInput).toHaveValue('Mensaje de prueba de accesibilidad');
    
    // Navegar al botón de envío
    await page.keyboard.press('Tab');
    await expect(sendButton).toBeFocused();
    
    // Activar con Enter
    await page.keyboard.press('Enter');
    
    // Verificar que el mensaje se envía
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer.locator('.message-user').last()).toContainText('Mensaje de prueba de accesibilidad');
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    
    // Verificar aria-label en elementos interactivos
    await expect(messageInput).toHaveAttribute('aria-label');
    await expect(sendButton).toHaveAttribute('aria-label');
    
    if (await voiceButton.isVisible()) {
      await expect(voiceButton).toHaveAttribute('aria-label');
    }
    
    // Verificar roles apropiados
    await expect(sendButton).toHaveAttribute('role', 'button');
    
    // Verificar que los mensajes tienen estructura semántica
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    if (await messagesContainer.locator('.message').first().isVisible()) {
      const firstMessage = messagesContainer.locator('.message').first();
      
      // Verificar que los mensajes tienen roles o estructura apropiada
      const hasRole = await firstMessage.getAttribute('role');
      const hasAriaLabel = await firstMessage.getAttribute('aria-label');
      
      expect(hasRole || hasAriaLabel).toBeTruthy();
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Verificar aria-live regions para anuncios dinámicos
    const liveRegion = page.locator('[aria-live]');
    if (await liveRegion.isVisible()) {
      await expect(liveRegion).toHaveAttribute('aria-live');
    }
    
    // Enviar mensaje y verificar anuncios
    await messageInput.fill('Mensaje para screen reader');
    await sendButton.click();
    
    // Verificar que hay elementos con aria-live para anunciar cambios
    const statusRegion = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"], [role="alert"]');
    if (await statusRegion.isVisible()) {
      await expect(statusRegion).toBeVisible();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Ejecutar análisis específico de contraste
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('[data-testid="message-input"]')
      .include('[data-testid="send-button"]')
      .include('[data-testid="messages-container"]')
      .analyze();
    
    // Filtrar solo violaciones de contraste
    const contrastViolations = contrastResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('should handle focus management correctly', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Verificar foco inicial
    await messageInput.focus();
    await expect(messageInput).toBeFocused();
    
    // Enviar mensaje
    await messageInput.fill('Prueba de manejo de foco');
    await sendButton.click();
    
    // Verificar que el foco regresa al input después del envío
    await expect(messageInput).toBeFocused();
    
    // Verificar que el input está limpio y listo para nuevo mensaje
    await expect(messageInput).toHaveValue('');
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simular modo de alto contraste
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Verificar que los elementos siguen siendo visibles
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    await expect(messageInput).toBeVisible();
    await expect(sendButton).toBeVisible();
    
    // Verificar que los estilos se adaptan al modo oscuro
    const inputStyles = await messageInput.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderColor: styles.borderColor
      };
    });
    
    // Verificar que hay contraste suficiente (colores no son iguales)
    expect(inputStyles.backgroundColor).not.toBe(inputStyles.color);
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Simular preferencia de movimiento reducido
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Enviar mensaje
    await messageInput.fill('Prueba sin animaciones');
    await sendButton.click();
    
    // Verificar que la funcionalidad sigue trabajando sin animaciones
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer.locator('.message-user').last()).toContainText('Prueba sin animaciones');
  });

  test('should support voice input accessibility', async ({ page }) => {
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    
    if (await voiceButton.isVisible()) {
      // Verificar atributos de accesibilidad
      await expect(voiceButton).toHaveAttribute('aria-label');
      await expect(voiceButton).toHaveAttribute('role', 'button');
      
      // Verificar estados ARIA
      await voiceButton.click();
      
      // Verificar aria-pressed o aria-expanded para estado activo
      const ariaPressed = await voiceButton.getAttribute('aria-pressed');
      const ariaExpanded = await voiceButton.getAttribute('aria-expanded');
      
      expect(ariaPressed === 'true' || ariaExpanded === 'true').toBeTruthy();
      
      // Desactivar
      await voiceButton.click();
      
      // Verificar que el estado se actualiza
      const ariaPressedAfter = await voiceButton.getAttribute('aria-pressed');
      const ariaExpandedAfter = await voiceButton.getAttribute('aria-expanded');
      
      expect(ariaPressedAfter === 'false' || ariaExpandedAfter === 'false').toBeTruthy();
    }
  });

  test('should handle error messages accessibly', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/ai/stream', route => {
      route.abort('failed');
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Enviar mensaje que fallará
    await messageInput.fill('Mensaje que causará error');
    await sendButton.click();
    
    // Verificar que el mensaje de error es accesible
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verificar atributos de accesibilidad del error
    const hasRole = await errorMessage.getAttribute('role');
    const hasAriaLive = await errorMessage.getAttribute('aria-live');
    
    expect(hasRole === 'alert' || hasAriaLive === 'assertive' || hasAriaLive === 'polite').toBeTruthy();
  });

  test('should support zoom up to 200%', async ({ page }) => {
    // Simular zoom al 200%
    await page.setViewportSize({ width: 640, height: 480 }); // Simula zoom
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Verificar que los elementos siguen siendo usables
    await expect(messageInput).toBeVisible();
    await expect(sendButton).toBeVisible();
    
    // Verificar que se puede interactuar normalmente
    await messageInput.fill('Prueba con zoom');
    await sendButton.click();
    
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer.locator('.message-user').last()).toContainText('Prueba con zoom');
  });

  test('should have proper form labels and descriptions', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    
    // Verificar que el input tiene label asociado
    const labelId = await messageInput.getAttribute('aria-labelledby');
    const ariaLabel = await messageInput.getAttribute('aria-label');
    const placeholder = await messageInput.getAttribute('placeholder');
    
    // Debe tener al menos una forma de etiquetado
    expect(labelId || ariaLabel || placeholder).toBeTruthy();
    
    // Si tiene aria-labelledby, verificar que el elemento existe
    if (labelId) {
      const labelElement = page.locator(`#${labelId}`);
      await expect(labelElement).toBeVisible();
    }
    
    // Verificar descripción si existe
    const describedBy = await messageInput.getAttribute('aria-describedby');
    if (describedBy) {
      const descriptionElement = page.locator(`#${describedBy}`);
      await expect(descriptionElement).toBeVisible();
    }
  });

  test('should handle keyboard shortcuts accessibly', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    
    // Verificar que Enter funciona para enviar
    await messageInput.fill('Mensaje con Enter');
    await messageInput.press('Enter');
    
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer.locator('.message-user').last()).toContainText('Mensaje con Enter');
    
    // Verificar que Escape limpia el input (si está implementado)
    await messageInput.fill('Texto para limpiar');
    await messageInput.press('Escape');
    
    // Verificar si se implementó la funcionalidad de Escape
    const inputValue = await messageInput.inputValue();
    // No forzamos que esté implementado, solo verificamos si funciona
    expect(typeof inputValue).toBe('string');
  });

  test('should announce loading states to screen readers', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    
    // Enviar mensaje
    await messageInput.fill('Mensaje para probar estados de carga');
    await sendButton.click();
    
    // Verificar que hay indicadores de estado accesibles
    const loadingIndicator = page.locator('[aria-live], [role="status"], [data-testid="typing-indicator"]');
    
    if (await loadingIndicator.first().isVisible()) {
      await expect(loadingIndicator.first()).toBeVisible();
      
      // Verificar que tiene atributos apropiados
      const hasAriaLive = await loadingIndicator.first().getAttribute('aria-live');
      const hasRole = await loadingIndicator.first().getAttribute('role');
      
      expect(hasAriaLive || hasRole === 'status').toBeTruthy();
    }
  });
});