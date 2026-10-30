const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
    res.send(`
        <h2>Subir archivos</h2>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="archivo" required />
            <button type="submit">Subir</button>
        </form>
    `);
});

app.post('/upload', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se subió ningún archivo.');
        }

        const originalName = path.parse(req.file.originalname).name;
        const extension = path.extname(req.file.originalname).toLowerCase();
        let finalFilename = '';
        let outputPath = '';

        if (extension === '.gif') {
            finalFilename = `${Date.now()}-${originalName}.gif`;
            outputPath = path.join(publicDir, finalFilename);

            await sharp(req.file.buffer, { animated: true })
                .gif({ lossless: true })
                .toFile(outputPath);

        } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
            finalFilename = `${Date.now()}-${originalName}.webp`;
            outputPath = path.join(publicDir, finalFilename);

            await sharp(req.file.buffer)
                .webp({ lossless: true })
                .toFile(outputPath);

        } else {
            finalFilename = `${Date.now()}-${req.file.originalname}`;
            outputPath = path.join(publicDir, finalFilename);
            fs.writeFileSync(outputPath, req.file.buffer);
        }

        res.send(`¡Archivo subido y procesado con éxito! URL pública: /public/${finalFilename}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Hubo un error al procesar el archivo.');
    }
});

app.use('/public', express.static(publicDir));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});