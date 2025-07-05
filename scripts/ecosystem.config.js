module.exports = {
  apps: [{
    name: 'manta-mes',
    script: 'npm',
    args: 'run dev:standard -- --port 3001',
    cwd: '/home/antonio/Scrivania/manta-management-system',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    time: true,
    autorestart: true,
    max_restarts: 5,
    min_uptime: '10s'
  }]
}