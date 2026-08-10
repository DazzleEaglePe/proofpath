import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @proofpath/shared es un paquete del workspace sin publicar: hay que
  // transpilarlo. Es lo que permite que el NAVEGADOR recompute el credentialHash
  // con exactamente el mismo codigo que usa el backend.
  transpilePackages: ['@proofpath/shared'],
};

export default nextConfig;
