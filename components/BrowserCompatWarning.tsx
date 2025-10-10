'use client';

import { useEffect, useState } from 'react';
import { 
  checkBrowserCapabilities, 
  getBrowserInfo, 
  isSecureContext,
  getRecommendedBrowsers,
  BrowserCapabilities 
} from '@/utils/browserCompat';

/**
 * Browser Compatibility Warning Component
 * 
 * Displays warning if browser is not fully supported.
 * 
 * Phase 6 Implementation
 */

export function BrowserCompatWarning() {
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof getBrowserInfo> | null>(null);
  const [secure, setSecure] = useState<boolean>(true);

  useEffect(() => {
    setCapabilities(checkBrowserCapabilities());
    setBrowserInfo(getBrowserInfo());
    setSecure(isSecureContext());
  }, []);

  if (!capabilities || capabilities.isSupported && browserInfo?.isSupported && secure) {
    return null; // All good!
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>⚠️</span>
        <h3 style={styles.title}>Browser Compatibility Warning</h3>
      </div>

      <div style={styles.content}>
        {/* Browser Not Supported */}
        {browserInfo && !browserInfo.isSupported && (
          <div style={styles.warning}>
            <p style={styles.warningText}>
              <strong>{browserInfo.name} {browserInfo.version}</strong> may not fully support all features.
            </p>
            <p style={styles.helpText}>
              For best experience, please use one of these browsers:
            </p>
            <ul style={styles.list}>
              {getRecommendedBrowsers().map(browser => (
                <li key={browser}>{browser}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Features */}
        {capabilities && !capabilities.isSupported && (
          <div style={styles.warning}>
            <p style={styles.warningText}>
              <strong>Missing Required Features:</strong>
            </p>
            <ul style={styles.list}>
              {capabilities.missingFeatures.map(feature => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Not Secure Context */}
        {!secure && (
          <div style={styles.warning}>
            <p style={styles.warningText}>
              <strong>Insecure Connection Detected</strong>
            </p>
            <p style={styles.helpText}>
              Microphone access requires HTTPS or localhost. Please access this app through:
            </p>
            <ul style={styles.list}>
              <li><code>https://your-domain.com</code></li>
              <li><code>http://localhost:3000</code></li>
            </ul>
          </div>
        )}

        {/* No Clipboard API (warning only) */}
        {capabilities && !capabilities.hasClipboardAPI && (
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              ℹ️ Clipboard API not available. Copy to clipboard may use fallback method.
            </p>
          </div>
        )}

        {/* Action */}
        <div style={styles.actionBox}>
          <p style={styles.actionText}>
            You can continue, but some features may not work correctly.
          </p>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    marginBottom: '1rem',
    animation: 'slideIn 0.3s ease-out',
  },
  header: {
    padding: '1rem 1.25rem',
    backgroundColor: '#fde68a',
    borderBottom: '1px solid #f59e0b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  icon: {
    fontSize: '1.5rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#78350f',
    margin: 0,
  },
  content: {
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  warning: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  warningText: {
    fontSize: '0.875rem',
    color: '#92400e',
    margin: 0,
    fontWeight: '600',
  },
  helpText: {
    fontSize: '0.8125rem',
    color: '#92400e',
    margin: 0,
  },
  list: {
    fontSize: '0.8125rem',
    color: '#92400e',
    margin: '0.25rem 0 0 1.5rem',
    padding: 0,
    lineHeight: '1.6',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '0.375rem',
    padding: '0.75rem',
  },
  infoText: {
    fontSize: '0.75rem',
    color: '#1e40af',
    margin: 0,
  },
  actionBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    padding: '0.75rem',
  },
  actionText: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
    textAlign: 'center' as const,
  },
};

