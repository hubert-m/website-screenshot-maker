module.exports = {
    apps: [
        {
            name: "website-screenshot-maker",
            script: "npm",
            args: "start",
            env: {
                PORT: 3000,
                NODE_ENV: "production"
            }
        }
    ]
}