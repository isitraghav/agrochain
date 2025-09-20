/**
 * URL utilities for generating batch detail URLs
 */

/**
 * Get the base URL for the application
 * This handles different deployment environments
 */
export function getBaseUrl(): string {
  // In browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // In development (default)
  return 'http://localhost:5173';
}

/**
 * Generate a batch detail URL for the given batch ID
 */
export function generateBatchDetailUrl(batchId: number, absolute: boolean = true): string {
  const path = `/batch/info/${batchId}`;

  if (absolute) {
    return `${getBaseUrl()}${path}`;
  }

  return path;
}

/**
 * Generate a shareable batch URL with additional context
 */
export function generateShareableBatchUrl(
  batchId: number,
  batchName?: string,
  includeViewHint: boolean = true
): string {
  const baseUrl = generateBatchDetailUrl(batchId, true);

  // Add UTM parameters for tracking
  const params = new URLSearchParams({
    utm_source: 'qr_code',
    utm_medium: 'share',
    utm_campaign: 'batch_tracking'
  });

  if (batchName) {
    params.set('name', encodeURIComponent(batchName));
  }

  // Add hint that this is viewable without wallet connection
  if (includeViewHint) {
    params.set('view', 'public');
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}