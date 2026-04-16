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

Run the development server:

```bash
npm run dev
```

The app will use `puppeteer.launch()` to start a fresh browser instance for each request in local development.

### 3. Production Deployment

In production, the app is optimized to connect to an **already running Chrome instance** to save resources and improve performance.

#### **Chrome Setup:**
Ensure Chrome/Chromium is running on your server with remote debugging enabled:

```bash
# Example for Windows
chrome.exe --remote-debugging-port=9222 --headless

# Example for Linux
google-chrome --remote-debugging-port=9222 --headless --no-sandbox
```

#### **Next.js Setup:**
1.  Set `NODE_ENV=production`.
2.  Configure `CHROME_DEBUGGER_URL` if your Chrome instance is not on the default port/host.
3.  Build and start:

```bash
npm run build
npm run start
```

## 📝 License

This project is open-source and available under the MIT License.
