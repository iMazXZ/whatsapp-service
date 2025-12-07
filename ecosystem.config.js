module.exports = {
    apps: [{
        name: 'whatsapp-service',
        script: 'index.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production',
            PORT: 3001
        },
        error_file: './logs/error.log',
        out_file: './logs/output.log',
        log_file: './logs/combined.log',
        time: true
    }]
};
