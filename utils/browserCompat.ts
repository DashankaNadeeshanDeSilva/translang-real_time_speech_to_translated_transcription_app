/**
 * Browser Compatibility Utilities
 * 
 * Detects browser capabilities and provides fallback messages
 * for unsupported features.
 * 
 * Phase 6 Implementation
 */

export interface BrowserCapabilities {
  hasMediaDevices: boolean;
  hasGetUserMedia: boolean;
  hasWebSocket: boolean;
  hasAudioContext: boolean;
  hasClipboardAPI: boolean;
  isSupported: boolean;
  missingFeatures: string[];
}

/**
 * Check browser capabilities
 */
export function checkBrowserCapabilities(): BrowserCapabilities {
  const missingFeatures: string[] = [];
  
  // Check MediaDevices API
  const hasMediaDevices = !!(navigator.mediaDevices);
  if (!hasMediaDevices) {
    missingFeatures.push('MediaDevices API');
  }
  
  // Check getUserMedia
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!hasGetUserMedia) {
    missingFeatures.push('getUserMedia (microphone access)');
  }
  
  // Check WebSocket
  const hasWebSocket = typeof WebSocket !== 'undefined';
  if (!hasWebSocket) {
    missingFeatures.push('WebSocket');
  }
  
  // Check AudioContext
  const hasAudioContext = typeof AudioContext !== 'undefined' || 
                          typeof (window as any).webkitAudioContext !== 'undefined';
  if (!hasAudioContext) {
    missingFeatures.push('AudioContext (Web Audio API)');
  }
  
  // Check Clipboard API
  const hasClipboardAPI = !!(navigator.clipboard && navigator.clipboard.writeText);
  // Note: Clipboard is nice-to-have, not required
  
  const isSupported = hasMediaDevices && hasGetUserMedia && hasWebSocket && hasAudioContext;
  
  return {
    hasMediaDevices,
    hasGetUserMedia,
    hasWebSocket,
    hasAudioContext,
    hasClipboardAPI,
    isSupported,
    missingFeatures,
  };
}

/**
 * Get browser name and version
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  isSupported: boolean;
} {
  const userAgent = navigator.userAgent;
  
  let name = 'Unknown';
  let version = 'Unknown';
  let isSupported = true;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 80;
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 80;
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 75;
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    isSupported = parseInt(version) >= 13;
  }
  
  return { name, version, isSupported };
}

/**
 * Check if HTTPS or localhost
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || 
         location.protocol === 'https:' ||
         location.hostname === 'localhost' ||
         location.hostname === '127.0.0.1';
}

/**
 * Get recommended browsers list
 */
export function getRecommendedBrowsers(): string[] {
  return [
    'Chrome 80+',
    'Edge 80+',
    'Firefox 75+',
    'Safari 13+',
  ];
}

/**
 * Check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unavailable'> {
  try {
    if (!navigator.permissions) {
      return 'unavailable';
    }
    
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch (error) {
    // Permissions API not supported or failed
    return 'unavailable';
  }
}

/**
 * Validate export data before download
 */
export function validateExportCapability(): {
  canExport: boolean;
  reason?: string;
} {
  // Check if Blob is supported
  if (typeof Blob === 'undefined') {
    return { canExport: false, reason: 'Blob API not supported' };
  }
  
  // Check if URL.createObjectURL is supported
  if (typeof URL === 'undefined' || !URL.createObjectURL) {
    return { canExport: false, reason: 'URL.createObjectURL not supported' };
  }
  
  return { canExport: true };
}

/**
 * Get user-friendly error messages for common issues
 */
export function getEdgeCaseMessage(scenario: string): string {
  const messages: Record<string, string> = {
    'no-audio': 'No microphone detected. Please connect a microphone and refresh the page.',
    'permission-denied': 'Microphone permission denied. Please allow microphone access in your browser settings.',
    'not-secure': 'TransLang requires HTTPS or localhost. Please use a secure connection.',
    'browser-unsupported': 'Your browser is not fully supported. Please use Chrome, Edge, Firefox, or Safari.',
    'websocket-failed': 'Failed to establish WebSocket connection. Please check your internet connection.',
    'empty-session': 'No audio detected. Please speak into your microphone.',
    'long-session': 'Session has been running for a long time. Consider stopping and starting fresh to prevent issues.',
  };
  
  return messages[scenario] || 'An unexpected issue occurred. Please try again.';
}

