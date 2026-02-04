/**
 * Dynamic Text Scaling Utility
 * 
 * Calculates and applies text scaling based on viewport size.
 * Ideal resolution: 2560 x 1440 with 125% Windows scaling = 2048px effective width
 */

// Configuration - Adjust these values to control min/max text scaling
export const TEXT_SCALE_CONFIG = {
  minScale: 0.9,    // Minimum scale factor (text will never be smaller than this)
  maxScale: 1.00,    // Maximum scale factor (text will never be larger than this)
  idealWidth: 2048  // Ideal effective viewport width (2560px / 1.25 = 2048px)
};

/**
 * Calculate the text scale factor based on current viewport
 * @param {Object} config - Configuration object with minScale, maxScale, and idealWidth
 * @returns {number} Scale factor (1.0 = no scaling, <1.0 = smaller, >1.0 = larger)
 */
export function calculateTextScale(config = TEXT_SCALE_CONFIG) {
  const { minScale, maxScale, idealWidth } = config;
  
  // Get current viewport width
  const currentWidth = window.innerWidth;
  
  // Calculate scale factor
  // If current width is less than ideal, scale down proportionally
  // If current width is greater than ideal, scale up proportionally
  const scaleFactor = currentWidth / idealWidth;
  
  // Clamp the scale factor to configured bounds
  // This prevents text from becoming too small or too large
  const clampedScale = Math.max(minScale, Math.min(maxScale, scaleFactor));
  
  return clampedScale;
}

/**
 * Apply text scale to the document root
 * @param {Object} config - Configuration object with minScale, maxScale, and idealWidth
 */
export function applyTextScale(config = TEXT_SCALE_CONFIG) {
  const scale = calculateTextScale(config);
  document.documentElement.style.setProperty('--text-scale-factor', scale);
}

/**
 * Initialize text scaling and set up resize listener
 * @param {Object} config - Optional configuration object to override defaults
 *   - minScale: Minimum scale factor (default: 0.5)
 *   - maxScale: Maximum scale factor (default: 1.5)
 *   - idealWidth: Ideal viewport width (default: 2048)
 */
export function initTextScaling(config = TEXT_SCALE_CONFIG) {
  // Apply initial scale immediately
  applyTextScale(config);
  
  // Use requestAnimationFrame for smooth, immediate updates
  let rafId = null;
  const handleResize = () => {
    // Cancel any pending animation frame
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    // Schedule update for next frame (very fast, ~16ms)
    rafId = requestAnimationFrame(() => {
      applyTextScale(config);
      rafId = null;
    });
  };
  
  window.addEventListener('resize', handleResize, { passive: true });
  
  // Also listen for orientation changes on mobile devices (immediate)
  const handleOrientationChange = () => {
    // Use requestAnimationFrame for immediate update
    requestAnimationFrame(() => applyTextScale(config));
  };
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // Also apply on load completion to catch any delayed layout changes
  const handleLoad = () => applyTextScale(config);
  if (document.readyState === 'complete') {
    applyTextScale(config);
  } else {
    window.addEventListener('load', handleLoad, { once: true });
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('load', handleLoad);
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  };
}

