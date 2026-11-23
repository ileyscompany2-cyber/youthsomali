import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/github-content.js';

export default createVercelFunction(handler);
