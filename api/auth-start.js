import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/auth-start.js';

export default createVercelFunction(handler);
