import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_INDEX_SCRIPT_DIR = import.meta.url.replace('file:///', '').replace('/index.js', '');
const BUILD_DIR = path.resolve(WEB_INDEX_SCRIPT_DIR, '../../build');

app.use(express.static(BUILD_DIR, { maxAge: '1d' }));

app.get('*', (req, res) => {
    res.sendFile(path.join("./", '404.html'), err => {
        if (err) {
            res.status(err.status || 500).send('Not found');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} -> serving ${BUILD_DIR}`);
});