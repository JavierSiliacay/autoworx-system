// Set this to true to enable maintenance mode across the public site
// It will only take effect on the live server (production), not on localhost (development)
export const IS_MAINTENANCE_MODE = true && process.env.NODE_ENV === 'production';
