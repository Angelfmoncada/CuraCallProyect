import { Page, Locator, expect } from '@playwright/test';

/**
 * Utilidades comunes para pruebas E2E
 */

export class ChatTestUtils {
  constructor(private page: Page) {}

  // Selectores comunes
  get messageInput(): Locator {
    return this.page.locator('[data-testid="message-input"]');
  }

  get sendButton(): Locator {
    return this.page.locator('[data-testid="send-button"]');
  }

  get voiceButton(): Locator {
    return this.page.locator('[data-testid="voice-input-button"]');
  }

  get messagesContainer(): Locator {
    return this.page.locator('[data-testid="messages-container"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[data-testid="error-message"]');
  }

  get typingIndicator(): Locator {
    return this.page.locator('[data-testid="typing-indicator"]');
  }

  get stopButton(): Locator {
    return this.page.locator('[data-testid="stop-button"]');
  }

  get retryButton(): Locator {
    return this.page.locator('[data-testid="retry-button"]');
  }

  // Métodos de utilidad
  async sendMessage(message: string, waitForResponse = true): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    
    // Verificar que el mensaje del usuario aparece
    await expect(this.messagesContainer.locator('.message-user').last())
      .toContainText(message);
    
    if (waitForResponse) {
      // Esperar respuesta del asistente
      await expect(this.messagesContainer.locator('.message-assistant').last())
        .toBeVisible({ timeout: 15000 });
    }
  }

  async waitForTypingIndicator(shouldAppear = true): Promise<void> {
    if (shouldAppear) {
      await expect(this.typingIndicator).toBeVisible({ timeout: 5000 });
    } else {
      await expect(this.typingIndicator).toBeHidden({ timeout: 10000 });
    }
  }

  async getMessageCount(): Promise<number> {
    return await this.messagesContainer.locator('.message').count();
  }

  async getLastUserMessage(): Promise<string> {
    return await this.messagesContainer.locator('.message-user').last().textContent() || '';
  }

  async getLastAssistantMessage(): Promise<string> {
    return await this.messagesContainer.locator('.message-assistant').last().textContent() || '';
  }

  async clearInput(): Promise<void> {
    await this.messageInput.clear();
  }

  async isInputEmpty(): Promise<boolean> {
    const value = await this.messageInput.inputValue();
    return value === '';
  }

  async isSendButtonEnabled(): Promise<boolean> {
    return await this.sendButton.isEnabled();
  }

  async waitForError(timeout = 10000): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout });
  }

  async waitForErrorToDisappear(timeout = 10000): Promise<void> {
    await expect(this.errorMessage).toBeHidden({ timeout });
  }

  async startVoiceRecording(): Promise<void> {
    await this.voiceButton.click();
    // Verificar estado de grabación si hay indicador visual
    const recordingIndicator = this.page.locator('[data-testid="recording-indicator"]');
    if (await recordingIndicator.isVisible()) {
      await expect(recordingIndicator).toBeVisible();
    }
  }

  async stopVoiceRecording(): Promise<void> {
    await this.voiceButton.click();
    // Verificar que se detiene la grabación
    const recordingIndicator = this.page.locator('[data-testid="recording-indicator"]');
    if (await recordingIndicator.isVisible()) {
      await expect(recordingIndicator).toBeHidden();
    }
  }

  async abortCurrentRequest(): Promise<void> {
    if (await this.stopButton.isVisible()) {
      await this.stopButton.click();
      await expect(this.stopButton).toBeHidden();
    }
  }

  async retryFailedRequest(): Promise<void> {
    if (await this.retryButton.isVisible()) {
      await this.retryButton.click();
    }
  }
}

/**
 * Utilidades para mocking de APIs
 */
export class MockUtils {
  constructor(private page: Page) {}

  async mockStreamingSuccess(response: string): Promise<void> {
    await this.page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `event: token\ndata: {"token": "${response}"}\n\nevent: done\ndata: {}\n\n`
      });
    });
  }

  async mockStreamingError(statusCode = 500, errorMessage = 'Internal Server Error'): Promise<void> {
    await this.page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: errorMessage })
      });
    });
  }

  async mockNetworkFailure(): Promise<void> {
    await this.page.route('**/api/ai/stream', route => {
      route.abort('failed');
    });
  }

  async mockTimeout(): Promise<void> {
    await this.page.route('**/api/ai/stream', route => {
      setTimeout(() => {
        route.abort('timedout');
      }, 5000);
    });
  }

  async mockRateLimit(): Promise<void> {
    await this.page.route('**/api/ai/stream', route => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '60' },
        body: JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again later.' 
        })
      });
    });
  }

  async mockSpeechRecognition(transcript: string): Promise<void> {
    await this.page.addInitScript((transcript) => {
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
                    0: { transcript },
                    isFinal: true
                  }]
                });
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
    }, transcript);
  }

  async mockSpeechSynthesis(): Promise<void> {
    await this.page.addInitScript(() => {
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
  }

  async clearAllMocks(): Promise<void> {
    await this.page.unroute('**/api/**');
  }
}

/**
 * Utilidades para accesibilidad
 */
export class AccessibilityUtils {
  constructor(private page: Page) {}

  async checkFocusOrder(selectors: string[]): Promise<void> {
    for (let i = 0; i < selectors.length; i++) {
      await this.page.keyboard.press('Tab');
      const focusedElement = this.page.locator(':focus');
      const expectedElement = this.page.locator(selectors[i]);
      
      // Verificar que el elemento esperado está enfocado
      const isSameElement = await focusedElement.evaluate((el, selector) => {
        return el === document.querySelector(selector);
      }, selectors[i]);
      
      expect(isSameElement).toBeTruthy();
    }
  }

  async checkAriaAttributes(selector: string, expectedAttributes: Record<string, string>): Promise<void> {
    const element = this.page.locator(selector);
    
    for (const [attr, expectedValue] of Object.entries(expectedAttributes)) {
      await expect(element).toHaveAttribute(attr, expectedValue);
    }
  }

  async simulateScreenReader(): Promise<void> {
    // Simular comportamiento de screen reader
    await this.page.addInitScript(() => {
      // Agregar eventos para simular anuncios de screen reader
      const announcements: string[] = [];
      
      // @ts-ignore
      window.screenReaderAnnouncements = announcements;
      
      // Interceptar cambios en aria-live regions
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target as Element;
            if (target.getAttribute('aria-live') || target.getAttribute('role') === 'status') {
              announcements.push(target.textContent || '');
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  async getScreenReaderAnnouncements(): Promise<string[]> {
    return await this.page.evaluate(() => {
      // @ts-ignore
      return window.screenReaderAnnouncements || [];
    });
  }
}

/**
 * Utilidades para performance
 */
export class PerformanceUtils {
  constructor(private page: Page) {}

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureResponseTime(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await action();
    return Date.now() - startTime;
  }

  async getNetworkRequests(): Promise<any[]> {
    const requests: any[] = [];
    
    this.page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });
    
    return requests;
  }
}