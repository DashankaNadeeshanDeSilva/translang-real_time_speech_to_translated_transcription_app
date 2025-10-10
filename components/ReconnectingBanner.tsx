'use client';

/**
 * Reconnecting Banner Component
 * 
 * Displays connection status and reconnection attempts to the user.
 * 
 * Phase 4 Implementation
 */

interface ReconnectingBannerProps {
  isReconnecting: boolean;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
}

export function ReconnectingBanner({
  isReconnecting,
  retryCount,
  maxRetries,
  errorMessage,
}: ReconnectingBannerProps) {
  if (!isReconnecting) {
    return null;
  }

  const isLastAttempt = retryCount >= maxRetries;

  return (
    <div style={isLastAttempt ? styles.errorBanner : styles.warningBanner}>
      <div style={styles.content}>
        <div style={styles.iconContainer}>
          {!isLastAttempt ? (
            <span style={styles.spinner}>🔄</span>
          ) : (
            <span>⚠️</span>
          )}
        </div>
        
        <div style={styles.textContainer}>
          <strong style={styles.title}>
            {isLastAttempt ? 'Connection Failed' : 'Reconnecting...'}
          </strong>
          <p style={styles.message}>
            {isLastAttempt ? (
              <>
                Maximum retry attempts reached. Please check your connection and try again.
              </>
            ) : (
              <>
                {errorMessage || 'Connection interrupted. Attempting to reconnect...'}
                <br />
                <span style={styles.retryInfo}>
                  Attempt {retryCount} of {maxRetries}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  warningBanner: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '0.75rem',
    padding: '1rem 1.5rem',
    marginBottom: '1rem',
    animation: 'slideIn 0.3s ease-out',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    border: '2px solid #ef4444',
    borderRadius: '0.75rem',
    padding: '1rem 1.5rem',
    marginBottom: '1rem',
    animation: 'slideIn 0.3s ease-out',
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  iconContainer: {
    fontSize: '1.5rem',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#78350f',
    display: 'block',
    marginBottom: '0.25rem',
  },
  message: {
    fontSize: '0.875rem',
    color: '#92400e',
    margin: 0,
    lineHeight: '1.5',
  },
  retryInfo: {
    fontSize: '0.75rem',
    color: '#a16207',
    fontWeight: '500',
  },
};

