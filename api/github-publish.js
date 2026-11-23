import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/github-publish.js';

export default createVercelFunction(handler);
