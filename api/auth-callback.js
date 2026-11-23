import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/auth-callback.js';

export default createVercelFunction(handler);
