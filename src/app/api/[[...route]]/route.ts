import { Hono } from 'hono';

import {
    matchedRoutes,
    routePath,
    baseRoutePath,
    basePath
} from 'hono/route';

const app = new Hono();
const apiApp = new Hono();

app.get('/post/:id', (c) => {
    const currentPath = routePath(c)
    const routes = matchedRoutes(c)

    return c.json({
        path: currentPath,
        totalRoutes: routes.length,
    })
});