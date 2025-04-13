import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

export async function getCertificate(): Promise<string> {
  // const certPath = isRunningInLambda()
  //   ? path.join('/var/task', 'configs', 'certs', 'global-bundle.pem')
  //   : path.join(
  //       __dirname,
  //       '..',
  //       '..',
  //       'src',
  //       'configs',
  //       'certs',
  //       'global-bundle.pem',
  //     );

  const certPaths = [
    path.join('/etc/pki/rds', 'global-bundle.pem'),

    isRunningInLambda()
      ? path.join('/var/task', 'configs', 'certs', 'global-bundle.pem')
      : null,

    path.join(
      __dirname,
      '..',
      '..',
      'src',
      'configs',
      'certs',
      'global-bundle.pem',
    ),
  ].filter(Boolean) as string[];

  for (const certPath of certPaths) {
    if (fs.existsSync(certPath)) {
      return certPath;
    }
  }

  // if (fs.existsSync(certPath)) {
  //   return certPath;
  // }

  const certPath = certPaths[2]; // local

  return await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(certPath);
    https
      .get(
        'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem',
        (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(certPath);
          });
        },
      )
      .on('error', (err) => {
        fs.unlink(certPath, () => reject(err));
      });
  });
}

function isRunningInLambda(): boolean {
  return !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}
