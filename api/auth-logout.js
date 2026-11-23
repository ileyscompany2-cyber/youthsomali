import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/auth-logout.js';

export default createVercelFunction(handler);
