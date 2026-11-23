import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/auth-session.js';

export default createVercelFunction(handler);
