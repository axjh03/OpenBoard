# Deployment Guide

## Deploying to Netlify

### Prerequisites
- Your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- You have a Netlify account

### Steps to Deploy

1. **Connect to Git Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your Git provider and select your repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18 (automatically set in netlify.toml)

3. **Environment Variables (Optional)**
   - If you need to override the backend URL, you can set:
     - `REACT_APP_BACKEND_URL` or `VITE_BACKEND_URL` (depending on your setup)

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

### Manual Deployment

If you prefer to deploy manually:

1. Build your project locally:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist` folder to Netlify's deploy area

### Custom Domain (Optional)

After deployment, you can:
1. Go to your site settings in Netlify
2. Navigate to "Domain management"
3. Add your custom domain

### Backend Configuration

The frontend is configured to use:
- **Production**: `https://openboard-l6io.onrender.com`
- **Development**: `http://localhost:3001`

The backend URL automatically switches based on the environment.
