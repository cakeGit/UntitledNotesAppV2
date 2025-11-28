import express from 'express';
import path from 'path';
import { apiRouter } from './apiRouter.js';
import { logWeb } from '../logger.mjs';

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_INDEX_SCRIPT_DIR = import.meta.url.replace('file:///', '').replace('/index.js', '');
const BUILD_DIR = path.resolve(WEB_INDEX_SCRIPT_DIR, '../../build');

app.use(express.json());

//Add api routes
app.use('/api/', apiRouter);

app.use(express.static(BUILD_DIR, { maxAge: '1d' }));

app.get('*', (req, res) => {
    //If no ending file extension, serve index.html (for react router)
    if (!path.extname(req.path)) {
        return res.sendFile(path.join(BUILD_DIR, 'index.html'));
    }

    res.sendFile(path.join('404.html'), err => {
        if (err) {
            res.status(err.status || 500).send('Not found');
        }
    });
});

app.listen(PORT, () => {
    logWeb(`Server running on http://localhost:${PORT} -> serving ${BUILD_DIR}`);
});