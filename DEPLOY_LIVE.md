# 🌐 Live Worldwide Website Deployment Guide

Your Sentinel Women's Safety Platform is ready for 24/7 global hosting. Anyone in the world on any phone, laptop, or tablet can access your app.

Here are the 3 free methods to have a permanent live HTTPS website:

---

## ⚡ Option 1: GitHub Pages (Instant 1-Click, Free Forever)

We have already pushed the production PWA frontend to the [`gh-pages`](https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app/tree/gh-pages) branch in your repository.

### To Activate (Takes 30 seconds):
1. Open your repository settings:
   👉 **[https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app/settings/pages](https://github.com/jaskaransinghajmani-cloud/sentinel-safety-app/settings/pages)**
2. Under **Build and deployment**:
   - **Source:** Select `Deploy from a branch`
   - **Branch:** Select `gh-pages` and folder `/ (root)`
3. Click **Save**.

Within 1 minute, your website will be live worldwide at:
👉 **`https://jaskaransinghajmani-cloud.github.io/sentinel-safety-app/`**

---

## 🚀 Option 2: Vercel (Instant Full-Stack Node.js + Frontend)

We have added [`vercel.json`](file:///d:/project/vercel.json) to your project and pushed it to GitHub.

### To Deploy (1 Click):
1. Go to **[https://vercel.com/new](https://vercel.com/new)**
2. Log in with your GitHub account (`jaskaransinghajmani-cloud`).
3. Find **`sentinel-safety-app`** and click **Import**.
4. Click **Deploy**.

Vercel will give you a permanent global CDN URL such as:
👉 **`https://sentinel-safety-app.vercel.app`**
- Both frontend and Express backend APIs (`/api/sos/trigger`, `/api/sms/send-direct`, etc.) will run automatically on Vercel Serverless.

---

## ☁️ Option 3: Render (Full 24/7 Node.js Cloud Server)

We have added [`render.yaml`](file:///d:/project/render.yaml) to your project and pushed it to GitHub.

### To Deploy:
1. Go to **[https://dashboard.render.com/web/new](https://dashboard.render.com/web/new)**
2. Connect your GitHub account and select **`sentinel-safety-app`**.
3. Render will automatically detect `render.yaml` and set up the Node.js server.
4. Click **Create Web Service**.

Render will give you a permanent URL like:
👉 **`https://sentinel-safety-app.onrender.com`**
