# Deployment Guide for Fitcha

This guide provides step-by-step instructions for deploying the Fitcha application to various platforms.

## 📋 Pre-deployment Checklist

- [ ] All tests are passing (`npm test`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Environment variables are configured
- [ ] Supabase database is set up with proper RLS policies
- [ ] All migrations have been applied

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

Netlify provides excellent support for React applications with automatic deployments.

#### Steps:
1. **Push to GitHub** (follow the GitHub setup instructions below)
2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select the Fitcha repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18` (in Environment variables)

4. **Set Environment Variables**:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Deploy**: Click "Deploy site"

#### Netlify Features:
- ✅ Automatic deployments on git push
- ✅ Branch previews
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Form handling
- ✅ Serverless functions

### Option 2: Vercel

Vercel offers excellent performance and developer experience.

#### Steps:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts to connect your GitHub repository
4. Set environment variables in the Vercel dashboard

### Option 3: GitHub Pages

For simple static hosting (note: limited environment variable support).

#### Steps:
1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

2. Add secrets in GitHub repository settings
3. Enable GitHub Pages in repository settings

## 🔧 Environment Configuration

### Required Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Environment Variables
```bash
# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Error Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
VITE_ENABLE_BETA_FEATURES=false
```

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migrations**:
   ```bash
   # Install Supabase CLI
   npm install -g @supabase/cli
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Apply migrations
   supabase db push
   ```

3. **Verify RLS Policies**:
   - Ensure all tables have Row Level Security enabled
   - Test policies with different user roles
   - Verify data access permissions

### Database Backup
```bash
# Create backup
supabase db dump --file backup.sql

# Restore from backup
supabase db reset --file backup.sql
```

## 🚀 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Check for unused dependencies
npx depcheck
```

### Recommended Optimizations
- Enable gzip compression on your hosting platform
- Configure CDN for static assets
- Set up proper caching headers
- Optimize images (WebP format)
- Enable service worker for caching

## 🔍 Monitoring and Analytics

### Error Monitoring (Sentry)
```bash
npm install @sentry/react @sentry/tracing
```

Add to your main.tsx:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Performance Monitoring
- Set up Core Web Vitals monitoring
- Configure performance budgets
- Monitor API response times
- Track user engagement metrics

## 🔒 Security Considerations

### Pre-deployment Security Checklist
- [ ] All API keys are in environment variables
- [ ] No sensitive data in client-side code
- [ ] HTTPS is enforced
- [ ] Content Security Policy is configured
- [ ] Input validation is implemented
- [ ] Rate limiting is in place (Supabase handles this)

### Security Headers
Configure these headers on your hosting platform:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 🐛 Troubleshooting

### Common Issues

**Build Fails**:
- Check Node.js version (requires 18+)
- Clear node_modules and reinstall
- Check for TypeScript errors

**Environment Variables Not Working**:
- Ensure variables start with `VITE_`
- Restart development server after changes
- Check hosting platform variable configuration

**Supabase Connection Issues**:
- Verify URL and key are correct
- Check network connectivity
- Ensure RLS policies allow access

**Performance Issues**:
- Enable production build optimizations
- Check for memory leaks in components
- Optimize image sizes and formats

## 📊 Post-deployment Checklist

- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Database operations function
- [ ] Real-time features work
- [ ] File uploads work (if applicable)
- [ ] Error tracking is active
- [ ] Performance monitoring is set up
- [ ] SSL certificate is valid
- [ ] Custom domain is configured (if applicable)

## 🔄 Continuous Deployment

### GitHub Actions Example
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=dist
      env:
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## 📞 Support

If you encounter issues during deployment:
1. Check the troubleshooting section above
2. Review hosting platform documentation
3. Check Supabase status page
4. Contact support team

---

**Happy Deploying! 🚀**