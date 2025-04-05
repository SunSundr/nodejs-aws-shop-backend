import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export async function getCertificate(): Promise<string> {
  const certUrl = 'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem';
  const certPath = path.join(__dirname, 'rds-ca-cert.pem');

  return new Promise((resolve, reject) => {
    if (fs.existsSync(certPath)) {
      resolve(certPath);
      return;
    }

    const file = fs.createWriteStream(certPath);
    https
      .get(certUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(certPath);
        });
      })
      .on('error', (err) => {
        fs.unlink(certPath, () => reject(err));
      });
  });
}
