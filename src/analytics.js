// Vercel Web Analytics. Se carga como módulo aparte para no tocar el
// script clásico de la página; en local no envía nada.
import { inject } from '@vercel/analytics';

inject({ mode: import.meta.env.PROD ? 'production' : 'development' });
