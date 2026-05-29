import fs from 'fs';
import path from 'path';

const BASE_PATH = '\\\\SERVIDOR\\Compartilhado';

export default async function handler(req, res) {
  try {
    const relativePath = req.query.path;

    if (!relativePath) {
      return res.status(400).json({
        error: 'Path não informado'
      });
    }

    // SEGURANÇA
    const normalizedPath = path.normalize(relativePath);

    // Impede ../../
    if (normalizedPath.includes('..')) {
      return res.status(403).json({
        error: 'Acesso negado'
      });
    }

    const fullPath = path.join(BASE_PATH, normalizedPath);

    // Verifica existência
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'Arquivo não encontrado'
      });
    }

    // Nome do arquivo
    const fileName = path.basename(fullPath);

    // Define headers
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${fileName}"`
    );

    // Stream do arquivo
    const stream = fs.createReadStream(fullPath);

    stream.pipe(res);

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message
    });
  }
}
