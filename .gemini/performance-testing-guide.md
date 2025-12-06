# Performance Testing Guide

## 🧪 How to Test the Optimizations

### Step 1: Build for Production

The optimizations only work in production mode. Development mode disables image optimization for faster iteration.

\`\`\`bash
npm run build
\`\`\`

**What to expect:**
- Build will take longer than usual (first time)
- Next.js will optimize all images
- You'll see output showing optimized routes and pages

### Step 2: Start Production Server

\`\`\`bash
npm start
\`\`\`

This runs the optimized production build.

### Step 3: Run Lighthouse Audit

1. **Open Chrome DevTools** (F12)
2. **Navigate to the Lighthouse tab**
3. **Configure the audit:**
   - Mode: Navigation
   - Device: Desktop (or Mobile)
   - Categories: Performance ✅
4. **Click "Analyze page load"**

### Step 4: Compare Results

#### Before Optimization:
- Performance: **71**
- LCP: **3.6s**
- Image Size: **1,314 KB**

#### Expected After Optimization:
- Performance: **90+** ✅
- LCP: **< 2.5s** ✅
- Image Size: **~5-10 KB** ✅

---

## 🔍 What to Check in Network Tab

### 1. **Image Optimization**

Open Network tab and filter by "Img":

**Before:**
\`\`\`
globallink-logo-dark.png - 1,314 KB
\`\`\`

**After:**
\`\`\`
globallink-logo-dark.png?w=160&q=90 - ~5 KB (WebP)
\`\`\`

### 2. **Response Headers**

Check that images have proper caching:
\`\`\`
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/webp
\`\`\`

### 3. **Priority Loading**

The logo should have:
- `fetchpriority="high"` attribute
- Loaded early in the waterfall

---

## 📊 Performance Metrics Explained

### Largest Contentful Paint (LCP)
**What it measures:** How long it takes for the largest content element to appear

**Target:** < 2.5s
**Your current:** 3.6s → Should be < 2.5s after optimization

**Why it matters:** Users perceive the page as loaded when they see the main content

### First Contentful Paint (FCP)
**What it measures:** Time to first pixel painted

**Target:** < 1.8s
**Your current:** 0.3s ✅ (Already excellent!)

### Cumulative Layout Shift (CLS)
**What it measures:** Visual stability (how much content shifts)

**Target:** < 0.1
**Your current:** 0.084 ✅ (Already excellent!)

### Speed Index
**What it measures:** How quickly content is visually displayed

**Target:** < 3.4s
**Your current:** 1.0s ✅ (Already excellent!)

---

## 🎯 Optimization Checklist

After running the production build, verify:

- [ ] **Images are WebP/AVIF format** (check Network tab)
- [ ] **Logo size is < 10 KB** (was 1,314 KB)
- [ ] **LCP is < 2.5s** (was 3.6s)
- [ ] **Performance score is 90+** (was 71)
- [ ] **No console logs in production** (check Console tab)
- [ ] **Bundle size is smaller** (check build output)

---

## 🐛 Troubleshooting

### Issue: Images still large
**Solution:** Make sure you're testing in production mode (`npm start`), not dev mode (`npm run dev`)

### Issue: Build fails
**Solution:** Clear `.next` folder and rebuild:
\`\`\`bash
rm -rf .next
npm run build
\`\`\`

### Issue: Images not converting to WebP
**Solution:** Check `next.config.mjs` has `formats: ['image/webp', 'image/avif']`

### Issue: Still seeing console logs
**Solution:** Make sure `NODE_ENV=production` is set when building

---

## 📈 Advanced Performance Tips

### 1. **Analyze Bundle Size**

\`\`\`bash
npm run build
\`\`\`

Look for the "Route (app)" section in the output. It shows:
- First Load JS: Total JavaScript for each route
- Size: Individual route size

**Target:** Keep First Load JS < 200 KB

### 2. **Check for Unused Dependencies**

Use webpack-bundle-analyzer:
\`\`\`bash
npm install --save-dev @next/bundle-analyzer
\`\`\`

### 3. **Monitor Real User Performance**

Vercel Analytics is already installed. After deployment, check:
- Real User Monitoring (RUM) data
- Core Web Vitals from actual users
- Performance trends over time

---

## 🚀 Deployment Checklist

Before deploying to production:

1. [ ] Run production build locally
2. [ ] Test all critical user flows
3. [ ] Verify Lighthouse score is 90+
4. [ ] Check images are optimized
5. [ ] Test on mobile and desktop
6. [ ] Verify dark mode works correctly
7. [ ] Check all pages load quickly

---

## 📝 Performance Monitoring

### After Deployment:

1. **Set up monitoring** with Vercel Analytics
2. **Track Core Web Vitals** over time
3. **Monitor bundle size** with each deployment
4. **Set performance budgets** (e.g., LCP < 2.5s)
5. **Regular audits** (monthly Lighthouse tests)

### Key Metrics to Track:

- **LCP:** < 2.5s (Good), 2.5-4s (Needs Improvement), > 4s (Poor)
- **FID:** < 100ms (Good), 100-300ms (Needs Improvement), > 300ms (Poor)
- **CLS:** < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)

---

## 🎉 Success Criteria

Your optimization is successful if:

✅ **Performance Score:** 90+ (from 71)
✅ **LCP:** < 2.5s (from 3.6s)
✅ **Image Size:** < 10 KB (from 1,314 KB)
✅ **Bundle Size:** Reduced by ~100 KB
✅ **User Experience:** Noticeably faster load times

**Total Improvement:** ~40-50% faster page loads!
