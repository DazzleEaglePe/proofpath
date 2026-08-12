import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // @proofpath/shared es un paquete del workspace sin publicar: hay que
  // transpilarlo. Es lo que permite que el NAVEGADOR recompute el credentialHash
  // con exactamente el mismo codigo que usa el backend.
  transpilePackages: ['@proofpath/shared'],
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000'],
};

export default nextConfig;
