# GitHub Setup Instructions for Fitcha

Since Git is not available in the WebContainer environment, follow these steps to set up your GitHub repository and deploy your code.

## 📋 Prerequisites

- GitHub account
- Git installed on your local machine
- Node.js 18+ installed locally

## 🚀 Step-by-Step GitHub Setup

### Step 1: Download Your Code

1. **Download the project files** from the WebContainer:
   - Use the download feature in your development environment
   - Or copy all files manually to your local machine

### Step 2: Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. **Click "New repository"** (green button)
3. **Repository settings**:
   - Repository name: `fitcha` (or your preferred name)
   - Description: `Athletic social platform - LinkedIn for athletes`
   - Visibility: `Public` or `Private` (your choice)
   - ✅ Add a README file (we'll replace it)
   - ✅ Add .gitignore: `Node`
   - ✅ Choose a license: `MIT License`

4. **Click "Create repository"**

### Step 3: Set Up Local Repository

Open terminal/command prompt and run:

```bash
# Clone the empty repository
git clone https://github.com/YOUR_USERNAME/fitcha.git
cd fitcha

# Remove the default README (we have a better one)
rm README.md

# Copy all your Fitcha project files into this directory
# (Copy everything from your downloaded WebContainer files)

# Add all files to git
git add .

# Make your first commit
git commit -m "Initial commit: Complete Fitcha application with comprehensive test suite

- Full-featured athletic social platform
- React + TypeScript + Supabase stack
- Comprehensive test suite with 94 test cases
- Authentication, social feed, player discovery
- Court booking system with real-time features
- Game requests and messaging system
- Profile management with achievements
- Complete QA analysis and documentation"

# Push to GitHub
git push origin main
```

### Step 4: Verify Upload

1. **Go to your GitHub repository** in the browser
2. **Check that all files are present**:
   - `src/` directory with all components
   - `package.json` with all dependencies
   - Test files in `src/__tests__/`
   - Documentation files (README.md, DEPLOYMENT.md)
   - Configuration files (.gitignore, vitest.config.ts)

## 🔧 Repository Configuration

### Step 5: Set Up Branch Protection (Recommended)

1. **Go to Settings > Branches** in your GitHub repository
2. **Add rule for `main` branch**:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

### Step 6: Set Up GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

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
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test
      
    - name: Run build
      run: npm run build
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: true
```

## 🚀 Deployment Setup

### Step 7: Deploy to Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Click "New site from Git"**
3. **Connect GitHub** and select your `fitcha` repository
4. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

5. **Add environment variables** in Netlify dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. **Deploy the site**

### Step 8: Set Up Supabase Database

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Apply database migrations**:
   - Copy SQL from `supabase/migrations/` files
   - Run in Supabase SQL editor
   - Ensure Row Level Security is enabled

3. **Get your credentials**:
   - Project URL
   - Anon key
   - Add these to Netlify environment variables

## 📊 Repository Features

### Enable Useful GitHub Features

1. **Issues**: For bug tracking and feature requests
2. **Projects**: For project management
3. **Wiki**: For additional documentation
4. **Discussions**: For community engagement

### Add Repository Topics

Add these topics to help others discover your project:
- `react`
- `typescript`
- `supabase`
- `sports`
- `social-platform`
- `vite`
- `tailwindcss`
- `athletic`
- `booking-system`

## 🔒 Security Setup

### Step 9: Configure Repository Security

1. **Enable Dependabot alerts**:
   - Go to Settings > Security & analysis
   - Enable dependency graph
   - Enable Dependabot alerts
   - Enable Dependabot security updates

2. **Set up code scanning**:
   - Enable CodeQL analysis
   - Configure for JavaScript/TypeScript

3. **Add security policy**:
   Create `SECURITY.md` file with vulnerability reporting instructions

## 📝 Documentation

### Step 10: Enhance Documentation

1. **Update README.md** with:
   - Live demo link (once deployed)
   - Screenshots of the application
   - Contribution guidelines
   - API documentation links

2. **Create additional docs**:
   - `CONTRIBUTING.md` - Contribution guidelines
   - `CODE_OF_CONDUCT.md` - Community guidelines
   - `CHANGELOG.md` - Version history

## 🎯 Next Steps

After setting up GitHub:

1. **Share your repository**:
   - Add the GitHub link to your portfolio
   - Share with potential collaborators
   - Submit to relevant showcases

2. **Continue development**:
   - Create feature branches for new development
   - Use pull requests for code review
   - Tag releases for version management

3. **Monitor and maintain**:
   - Watch for security alerts
   - Keep dependencies updated
   - Monitor deployment status

## 🆘 Troubleshooting

### Common Issues

**Large file errors**:
- Check if any files exceed GitHub's 100MB limit
- Use Git LFS for large assets if needed

**Permission denied**:
- Ensure you have write access to the repository
- Check SSH key configuration

**Build failures**:
- Verify all environment variables are set
- Check Node.js version compatibility

## 📞 Support

If you need help with GitHub setup:
1. Check GitHub's documentation
2. Review the troubleshooting section
3. Contact GitHub support for platform issues

---

**Your Fitcha application is now ready for the world! 🌟**