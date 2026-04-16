# 📸 Website Screenshot Maker

A modern, high-performance web application to capture, customize, and download website screenshots. Built with **Next.js 14+**, **Tailwind CSS 4**, and **Puppeteer**.

![Screenshot App Mockup](https://raw.githubusercontent.com/lucide-react/lucide/main/icons/camera.svg)

## 🚀 Key Features

-   **Intelligent Browser Automation:** Adaptive connection logic for local and production environments.
-   **Full Customization:** Control width, height, and file format (PNG/JPG).
-   **Full Page Mode:** Capture the entire length of any webpage with one click.
-   **Premium UI:** Glassmorphism design with smooth animations and responsive feedback.
-   **One-Click Download:** Screenshots are automatically prepared and downloaded to your device.

## 🛠️ Tech Stack

-   **Frontend:** Next.js (App Router), React, TypeScript.
-   **Styling:** Tailwind CSS 4, Lucide React (Icons).
-   **Backend:** Puppeteer (Headless Chrome).

## ⚙️ Environment Configuration

The application uses environment variables for flexible deployment. Copy `.env.example` to `.env.local` to get started.

| Variable | Description | Default |
| :--- | :--- | :--- |
| `CHROME_DEBUGGER_URL` | URL to fetch Chrome's `webSocketDebuggerUrl` (Production only). | `http://127.0.0.1:9222/json/version` |
| `NODE_ENV` | Current environment (`development` or `production`). | `development` |

## 💻 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Running Locally
```bash
npm run dev
```
In development, the app automatically launches a local browser instance.

## 🌐 Production Deployment (Self-Hosted)

### 1. Process Management with PM2
To ensure the application (and Chrome) stays running 24/7, it is highly recommended to use [PM2](https://pm2.keymetrics.io/).

#### **Start Next.js:**
```bash
npm run build
pm2 start npm --name "screenshot-maker" -- start
```

#### **Start Chrome with Remote Debugging:**
Manage the Chrome instance with PM2 to ensure auto-restart on failure:
```bash
# Example for Linux
pm2 start "google-chrome --remote-debugging-port=9222 --headless --no-sandbox" --name "chrome-debug"
```

Save process list for persistence across reboots:
```bash
pm2 save
pm2 startup
```

### 2. Domain & Reverse Proxy (Nginx)
Next.js runs on port `3000` by default. Your domain should **not** point directly to the project directory, but rather proxy requests to the running process via a reverse proxy like Nginx.

#### **Nginx Configuration Example:**
Create a config file in `/etc/nginx/sites-available/screenshot.example.com`:

```nginx
server {
    listen 80;
    server_name screenshot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Summary of Steps
1.  **Clone** the repository and `npm install`.
2.  **Build** the project: `npm run build`.
3.  **Start Chrome** via PM2 (port 9222).
4.  **Start Next.js** via PM2 (port 3000).
5.  **Configure Nginx** to proxy `screenshot.yourdomain.com` to `http://localhost:3000`.

## 📝 License
This project is open-source and available under the MIT License.
