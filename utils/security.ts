/**
 * Security utility functions for the application
 */

/**
 * Allowed redirect URLs for authentication flows
 * Add your production and development URLs here
 */
const ALLOWED_REDIRECT_URLS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://gestionintegralcorporativa.netlify.app',
    // Add your production domain here
];

/**
 * Get a safe redirect URL, preventing open redirect vulnerabilities
 * @returns A validated redirect URL
 */
export const getSafeRedirectUrl = (): string => {
    const origin = window.location.origin;
    return ALLOWED_REDIRECT_URLS.includes(origin)
        ? origin
        : ALLOWED_REDIRECT_URLS[ALLOWED_REDIRECT_URLS.length - 1]; // Default to production
};

/**
 * Validate and sanitize user input to prevent injection attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 500); // Limit length
};

/**
 * Check if user has required role
 * @param userRole - Current user's role
 * @param requiredRoles - Array of allowed roles
 * @returns boolean
 */
export const hasRequiredRole = (userRole: string, requiredRoles: string[]): boolean => {
    return requiredRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase());
};

/**
 * Allowed roles for administrative operations
 */
export const ADMIN_ROLES = ['admin', 'gerente', 'manager'];

/**
 * Allowed roles for viewing sensitive data
 */
export const VIEWER_ROLES = [...ADMIN_ROLES, 'supervisor', 'viewer'];
