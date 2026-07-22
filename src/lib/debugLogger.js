/**
 * Debug logging utility for consistent logging across the application.
 * Can be enabled/disabled via localStorage.setItem('DEBUG_MODE', 'true')
 */

const isDebugMode = () => {
  try {
    return localStorage.getItem('DEBUG_MODE') === 'true';
  } catch (e) {
    return false;
  }
};

const formatMessage = (component, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${component}]: ${message}`;
};

export const logger = {
  log: (component, message, data = null) => {
    if (isDebugMode()) {
      const formatted = formatMessage(component, message);
      if (data) {
        console.log(formatted, data);
      } else {
        console.log(formatted);
      }
    }
  },

  info: (component, message, data = null) => {
    if (isDebugMode()) {
      const formatted = formatMessage(component, message);
      if (data) {
        console.info(`%c${formatted}`, 'color: #3b82f6', data);
      } else {
        console.info(`%c${formatted}`, 'color: #3b82f6');
      }
    }
  },

  warn: (component, message, data = null) => {
    // Warnings are always useful, but respecting debug mode for consistency
    // or we can allow warnings always. Let's respect debug mode for now or just log.
    const formatted = formatMessage(component, message);
    if (data) {
      console.warn(`%c${formatted}`, 'color: #eab308', data);
    } else {
      console.warn(`%c${formatted}`, 'color: #eab308');
    }
  },

  error: (component, message, error = null) => {
    // Errors should always be logged regardless of debug mode
    const formatted = formatMessage(component, message);
    if (error) {
      console.error(`%c${formatted}`, 'color: #ef4444', error);
    } else {
      console.error(`%c${formatted}`, 'color: #ef4444');
    }
  }
};

// Auto-enable for development if needed (optional)
// if (process.env.NODE_ENV === 'development') localStorage.setItem('DEBUG_MODE', 'true');