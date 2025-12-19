/**
 * Utility for resolving asset paths with proper base URL
 * Handles GitHub Pages deployment where base path differs from root
 */

/**
 * Get the asset path with proper base URL prefix
 * In production builds with a base path (e.g., GitHub Pages),
 * this ensures assets resolve correctly
 *
 * @param path - The asset path starting with /
 * @returns The path with proper base URL prefix
 *
 * @example
 * assetPath('/images/logo.png')
 * // In dev: '/images/logo.png'
 * // On GitHub Pages: '/demo-agentic-builder/images/logo.png'
 */
export function assetPath(path: string): string {
  const base = import.meta.env.BASE_URL || '/';

  // Remove leading slash from path if base already ends with /
  if (base.endsWith('/') && path.startsWith('/')) {
    return `${base}${path.slice(1)}`;
  }

  // Add slash between base and path if needed
  if (!base.endsWith('/') && !path.startsWith('/')) {
    return `${base}/${path}`;
  }

  return `${base}${path}`;
}
