const root = process.env.PROOFPATH_ROOT || '/var/www/proofpath';
const node = process.env.PROOFPATH_NODE || '/opt/node-v24/bin/node';

module.exports = {
  apps: [
    {
      name: 'proofpath-api',
      cwd: `${root}/apps/api`,
      script: 'dist/main.js',
      interpreter: node,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3201',
      },
    },
    {
      name: 'proofpath-web',
      cwd: `${root}/apps/web`,
      script: 'node_modules/next/dist/bin/next',
      interpreter: node,
      args: 'start -H 127.0.0.1 -p 3200',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '768M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
