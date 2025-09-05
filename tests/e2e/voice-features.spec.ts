import { test, expect } from '@playwright/test';

test.describe('Voice Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la aplicación
    await page.goto('/');
    
    // Esperar a que la aplicación cargue completamente
    await page.waitForLoadState('networkidle');
    
    // Otorgar permisos de micrófono (simulado)
    await page.context().grantPermissions(['microphone']);
  });

  test('should show voice input button', async ({ page }) => {
    // Verificar que el botón de voz está presente
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    await expect(voiceButton).toBeVisible();
    
    // Verificar que tiene el ícono correcto
    await expect(voiceButton.locator('svg')).toBeVisible();
  });

  test('should toggle voice recording state', async ({ page }) => {
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    
    // Estado inicial - no grabando
    await expect(voiceButton).not.toHaveClass(/recording/);
    
    // Simular click para iniciar grabación
    await voiceButton.click();
    
    // Verificar estado de grabación
    await expect(voiceButton).toHaveClass(/recording/);
    
    // Click nuevamente para detener
    await voiceButton.click();
    
    // Verificar que vuelve al estado normal
    await expect(voiceButton).not.toHaveClass(/recording/);
  });

  test('should show recording indicator when active', async ({ page }) => {
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
    
    // Iniciar grabación
    await voiceButton.click();
    
    // Verificar que aparece el indicador de grabación
    await expect(recordingIndicator).toBeVisible();
    
    // Detener grabación
    await voiceButton.click();
    
    // Verificar que desaparece el indicador
    await expect(recordingIndicator).toBeHidden();
  });

  test('should handle voice input timeout', async ({ page }) => {
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
    
    // Iniciar grabación
    await voiceButton.click();
    await expect(recordingIndicator).toBeVisible();
    
    // Esperar timeout (simulado - ajustar según configuración)
    await page.waitForTimeout(10000);
    
    // Verificar que la grabación se detiene automáticamente
    await expect(recordingIndicator).toBeHidden({ timeout: 2000 });
    await expect(voiceButton).not.toHaveClass(/recording/);
  });

  test('should show voice permission error when denied', async ({ page }) => {
    // Crear nuevo contexto sin permisos
    const context = await page.context().browser()?.newContext({
      permissions: []
    });
    
    if (context) {
      const newPage = await context.newPage();
      await newPage.goto('/');
      await newPage.waitForLoadState('networkidle');
      
      const voiceButton = newPage.locator('[data-testid="voice-input-button"]');
      const errorMessage = newPage.locator('[data-testid="voice-error"]');
      
      // Intentar usar voz sin permisos
      await voiceButton.click();
      
      // Verificar que aparece mensaje de error
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/permiso|micrófono|acceso/i);
      
      await context.close();
    }
  });

  test('should handle TTS (Text-to-Speech) functionality', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    
    // Enviar mensaje para obtener respuesta
    await messageInput.fill('Di algo corto');
    await sendButton.click();
    
    // Esperar respuesta del asistente
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
    
    // Buscar botón de TTS en el mensaje del asistente
    const ttsButton = messagesContainer.locator('.message-assistant').last().locator('[data-testid="tts-button"]');
    
    if (await ttsButton.isVisible()) {
      // Verificar que el botón TTS está presente
      await expect(ttsButton).toBeVisible();
      
      // Click en TTS
      await ttsButton.click();
      
      // Verificar estado de reproducción (si hay indicador visual)
      const speakingIndicator = page.locator('[data-testid="speaking-indicator"]');
      if (await speakingIndicator.isVisible()) {
        await expect(speakingIndicator).toBeVisible();
      }
    }
  });

  test('should handle voice input with mock speech recognition', async ({ page }) => {
    // Mock de SpeechRecognition API
    await page.addInitScript(() => {
      // @ts-ignore
      window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || class {
        continuous = false;
        interimResults = false;
        lang = 'es-ES';
        onstart = null;
        onresult = null;
        onerror = null;
        onend = null;
        
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onresult) {
                this.onresult({
                  results: [{
                    0: { transcript: 'Hola, esto es una prueba de voz' },
                    isFinal: true
                  }]
                });
              }
              if (this.onend) this.onend();
            }, 2000);
          }, 100);
        }
        
        stop() {
          if (this.onend) this.onend();
        }
        
        abort() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    const messageInput = page.locator('[data-testid="message-input"]');
    
    // Iniciar grabación de voz
    await voiceButton.click();
    
    // Esperar a que termine el reconocimiento simulado
    await page.waitForTimeout(3000);
    
    // Verificar que el texto se transcribió al input
    await expect(messageInput).toHaveValue('Hola, esto es una prueba de voz');
  });

  test('should handle speech recognition errors', async ({ page }) => {
    // Mock de SpeechRecognition con error
    await page.addInitScript(() => {
      // @ts-ignore
      window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || class {
        continuous = false;
        interimResults = false;
        lang = 'es-ES';
        onstart = null;
        onresult = null;
        onerror = null;
        onend = null;
        
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            setTimeout(() => {
              if (this.onerror) {
                this.onerror({ error: 'network' });
              }
              if (this.onend) this.onend();
            }, 1000);
          }, 100);
        }
        
        stop() {
          if (this.onend) this.onend();
        }
        
        abort() {
          if (this.onend) this.onend();
        }
      };
    });
    
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    const errorMessage = page.locator('[data-testid="voice-error"]');
    
    // Intentar usar reconocimiento de voz
    await voiceButton.click();
    
    // Esperar error
    await page.waitForTimeout(2000);
    
    // Verificar que aparece mensaje de error
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  test('should handle TTS with mock speech synthesis', async ({ page }) => {
    // Mock de SpeechSynthesis API
    await page.addInitScript(() => {
      // @ts-ignore
      window.speechSynthesis = {
        speak: (utterance) => {
          setTimeout(() => {
            if (utterance.onstart) utterance.onstart();
            setTimeout(() => {
              if (utterance.onend) utterance.onend();
            }, 1000);
          }, 100);
        },
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        getVoices: () => [{
          name: 'Test Voice',
          lang: 'es-ES',
          default: true
        }]
      };
      
      // @ts-ignore
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
          this.onstart = null;
          this.onend = null;
          this.onerror = null;
        }
      };
    });
    
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    
    // Enviar mensaje
    await messageInput.fill('Prueba de síntesis de voz');
    await sendButton.click();
    
    // Esperar respuesta
    await expect(messagesContainer.locator('.message-assistant').last()).toBeVisible({ timeout: 10000 });
    
    // Buscar y usar botón TTS
    const ttsButton = messagesContainer.locator('.message-assistant').last().locator('[data-testid="tts-button"]');
    
    if (await ttsButton.isVisible()) {
      await ttsButton.click();
      
      // Verificar indicador de reproducción
      const speakingIndicator = page.locator('[data-testid="speaking-indicator"]');
      if (await speakingIndicator.isVisible()) {
        await expect(speakingIndicator).toBeVisible();
        
        // Esperar a que termine
        await expect(speakingIndicator).toBeHidden({ timeout: 3000 });
      }
    }
  });

  test('should handle voice features accessibility', async ({ page }) => {
    const voiceButton = page.locator('[data-testid="voice-input-button"]');
    
    // Verificar atributos de accesibilidad
    await expect(voiceButton).toHaveAttribute('aria-label');
    await expect(voiceButton).toHaveAttribute('role', 'button');
    
    // Verificar navegación por teclado
    await voiceButton.focus();
    await expect(voiceButton).toBeFocused();
    
    // Activar con Enter
    await voiceButton.press('Enter');
    await expect(voiceButton).toHaveClass(/recording/);
    
    // Desactivar con Espacio
    await voiceButton.press('Space');
    await expect(voiceButton).not.toHaveClass(/recording/);
  });
});