# 🎯 Buyer Page Performance Optimization Plan

## Current Lighthouse Scores (localhost:3000/buyer)
- **Performance: 80** 🟠 (Target: 90+)
- **Accessibility: 88** 🟠 (Good)
- **Best Practices: 74** 🟠 (Target: 90+)
- **SEO: 100** 🟢 (Perfect!)

---

## 🔴 Critical Performance Issues

### 1. **Render Blocking Requests** - Est. savings: 40 ms
**Status:** ✅ Will be fixed in production build
**Action:** None needed - Next.js handles this automatically

### 2. **LCP Request Discovery**
**Status:** ✅ ALREADY FIXED
**What we did:** Added `priority` prop to logos
**Verify:** Check buyer-layout.tsx has `<ThemeLogo priority />`

### 3. **Network Dependency Tree**
**Status:** ✅ ALREADY OPTIMIZED
**What we did:** Configured image optimization and package imports

---

## 🟠 Important Performance Issues

### 4. **Reduce Unused JavaScript** - Est. savings: 765 KB
**Status:** ✅ ALREADY CONFIGURED
**What we did:**
- Enabled SWC minification
- Package import optimization  
- Console removal in production

**Additional optimization needed:**
Use dynamic imports for heavy components in buyer/offers/page.tsx

### 5. **Page Prevented Back/Forward Cache Restoration** - 3 failure reasons
**Status:** ⚠️ NEEDS INVESTIGATION
**Possible causes:**
- `window.location.href` usage (we use this for navigation)
- Event listeners not cleaned up
- Unfinished network requests

**Fix:** Replace `window.location.href` with Next.js router

### 6. **Minify JavaScript** - Est. savings: 11 KB
**Status:** ✅ ALREADY CONFIGURED
**What we did:** Enabled `swcMinify: true`

### 7. **Avoid Serving Legacy JavaScript** - Est. savings: 45 KB
**Status:** ✅ Automatically handled by Next.js 15

### 8. **Reduce Unused CSS** - Est. savings: 45 KB
**Status:** ✅ Automatically handled by Tailwind v4

---

## 🚀 Action Items

### **Priority 1: Replace window.location.href with Next.js Router**

This will fix the back/forward cache issue and improve performance.

**File:** `app/buyer/offers/page.tsx`

**Current code:**
\`\`\`typescript
onClick={() => window.location.href = \`/offer-details?offerId=\${offer.id}\`}
\`\`\`

**Replace with:**
\`\`\`typescript
import { useRouter } from 'next/navigation'

// In component:
const router = useRouter()

onClick={() => router.push(\`/offer-details?offerId=\${offer.id}\`)}
\`\`\`

**Locations to fix:**
1. Line 439: View Details button
2. Line 446 & 451: Show Order Status button
3. Any other window.location.href usage

---

### **Priority 2: Use Dynamic Imports for Heavy Components**

Reduce initial bundle size by lazy-loading components.

**File:** Create `app/buyer/offers/dynamic-components.ts`

\`\`\`typescript
import dynamic from 'next/dynamic'

export const DynamicDialog = dynamic(
  () => import('@/components/ui/dialog').then(mod => mod.Dialog),
  { loading: () => null, ssr: false }
)

export const DynamicDialogContent = dynamic(
  () => import('@/components/ui/dialog').then(mod => mod.DialogContent),
  { loading: () => null, ssr: false }
)

export const DynamicTabs = dynamic(
  () => import('@/components/ui/tabs').then(mod => mod.Tabs),
  { loading: () => <div>Loading...</div> }
)
\`\`\`

Then in `page.tsx`:
\`\`\`typescript
import { DynamicDialog, DynamicDialogContent, DynamicTabs } from './dynamic-components'
\`\`\`

---

### **Priority 3: Optimize Images in Offers**

**File:** `app/buyer/offers/page.tsx` (around line 380)

**Current code:**
\`\`\`typescript
<img
  src={(offer.request?.photos?.[0] || request?.photos?.[0]) as string}
  alt="Item photo"
  className="w-20 h-20 object-cover rounded border"
/>
\`\`\`

**Replace with:**
\`\`\`typescript
import Image from 'next/image'

<Image
  src={(offer.request?.photos?.[0] || request?.photos?.[0]) as string}
  alt="Item photo"
  width={80}
  height={80}
  className="object-cover rounded border"
/>
\`\`\`

---

### **Priority 4: Build for Production**

**This is CRITICAL!** All optimizations only work in production.

\`\`\`bash
npm run build
npm start
\`\`\`

Then test on `http://localhost:3000/buyer`

---

## 📊 Expected Results After Fixes

| Metric | Current | After Fixes | Improvement |
|--------|---------|-------------|-------------|
| **Performance** | 80 | **90+** | **+10 points** |
| **Best Practices** | 74 | **90+** | **+16 points** |
| **Unused JS** | 765 KB | **< 200 KB** | **-565 KB** |
| **Unused CSS** | 45 KB | **< 10 KB** | **-35 KB** |
| **Back/Forward Cache** | Failed | **Passed** | **✅** |

---

## ✅ Already Optimized

From previous work:
- ✅ Next.js Image Optimization enabled
- ✅ WebP/AVIF format support
- ✅ Priority loading for LCP images
- ✅ SWC minification enabled
- ✅ Console removal in production
- ✅ Package import optimization
- ✅ Production source maps
- ✅ Enhanced metadata for SEO

---

## 🔧 Implementation Order

1. **Fix buyer/offers/page.tsx** - Replace window.location.href with router
2. **Add dynamic imports** - Reduce initial bundle size
3. **Optimize images** - Replace <img> with Next.js Image
4. **Build for production** - Apply all optimizations
5. **Test with Lighthouse** - Verify improvements

---

## 📝 Next Steps

1. I'll implement the router fixes
2. Add dynamic imports
3. Optimize images
4. You build for production and test

Let's start with Priority 1!
