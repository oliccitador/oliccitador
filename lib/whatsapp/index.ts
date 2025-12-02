/**
 * WhatsApp Module Barrel Exports
 * Centralizes all exports for easier importing
 */

export { WhatsAppOrchestrator } from './orchestrator';
export { WhatsAppClient } from './whatsapp-client';
export { SessionManager } from './session-manager';
export { BotComercial } from './bot-comercial';
export { BotTecnico } from './bot-tecnico';
export { ChatGPTClient } from './chatgpt-client';
export { SecurityLayer } from './security';

export type { SessionMessage, WhatsAppSession } from './session-manager';
export type { Message } from './chatgpt-client';
