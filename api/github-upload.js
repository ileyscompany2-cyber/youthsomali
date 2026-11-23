import { createVercelFunction } from '../server/vercel-handler.js';
import { handler } from '../server/functions/github-upload.js';

export default createVercelFunction(handler);
