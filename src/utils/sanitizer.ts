import DOMPurify from 'dompurify'

// Configure DOMPurify for rich text editor
const purifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'u', 'span', 'mark'],
  ALLOWED_ATTR: ['style'],
  ALLOWED_STYLES: {
    '*': {
      'background-color': [/^#[0-9a-fA-F]{6}$/, /^rgb\(/, /^transparent$/],
      'text-decoration': [/^underline$/],
    },
  },
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
}

/**
 * Sanitize HTML content from rich text editor
 * Removes dangerous tags, scripts, and malicious attributes
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, purifyConfig) as string
}

/**
 * Sanitize content for display only (more restrictive)
 */
export function sanitizeForDisplay(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return ''
  return DOMPurify.sanitize(dirty, {
    ...purifyConfig,
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'u', 'span', 'mark', 'ul', 'ol', 'li'],
  }) as string
}
