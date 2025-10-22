# UI Testing Guide - Language Settings Component

## Quick Start
Your development server is already running at: **http://localhost:3000**

## What to Test

### 1. Spacing Between Sections ✓

**How to test:**
1. Open the app in your browser
2. Look at the left sidebar
3. Observe the three accordion sections:
   - 🌍 Source Languages
   - 📚 Vocabulary & Context Hints
   - 💬 Chat Behavior

**What to check:**
- [ ] Each section has comfortable white space between them (~24px)
- [ ] Sections don't look cramped or touching
- [ ] The visual separation is clear and comfortable to read

**Expected result:** You should see clear breathing room between each section, making it easy to distinguish where one ends and another begins.

---

### 2. Source Languages Dropdown ✓

**How to test:**
1. Click on "🌍 Source Languages" to expand (if not already expanded)
2. Click on the language selector dropdown (shows current language)
3. The dropdown menu should open with all language options

**What to check:**
- [ ] Dropdown menu appears completely **opaque** (not see-through)
- [ ] Dropdown menu appears **on top** of all other components
- [ ] You **cannot see** the sections below through the dropdown
- [ ] Dropdown has a solid white background (or dark in dark mode)
- [ ] Dropdown has a clear shadow/border
- [ ] No visual overlap or transparency issues

**Expected result:** When the dropdown opens, it should completely cover anything below it with a solid, opaque background. The menu should look professional and crisp, not transparent.

---

### 3. Accordion Backgrounds ✓

**How to test:**
1. Look at each accordion section when closed
2. Look at each accordion section when opened

**What to check:**
- [ ] Each accordion has a **solid** background (not transparent)
- [ ] Backgrounds are white in light mode
- [ ] Backgrounds are dark slate in dark mode
- [ ] Each section has a subtle shadow
- [ ] No see-through effects

**Expected result:** All accordion sections should have solid, opaque backgrounds with subtle shadows for depth.

---

### 4. Dropdown Selection ✓

**How to test:**
1. Open the Source Languages dropdown
2. Select different languages:
   - 🇩🇪 German
   - 🇺🇸 English
   - 🇪🇸 Spanish
   - 🇫🇷 French
   - 🇮🇹 Italian
   - 🇵🇹 Portuguese
   - 🌐 Auto-Detect

**What to check:**
- [ ] Each language option is clearly visible
- [ ] Hover effect works (background changes)
- [ ] Selected language shows a checkmark
- [ ] After selection, dropdown closes smoothly
- [ ] Selected language appears in the accordion header
- [ ] Help text updates below the dropdown

**Expected result:** Language selection should be smooth, with clear visual feedback and no overlap issues.

---

### 5. Vocabulary & Context Hints ✓

**How to test:**
1. Click on "📚 Vocabulary & Context Hints" to expand
2. Type some text in the textarea

**What to check:**
- [ ] Textarea has solid background
- [ ] Text is clearly visible
- [ ] Textarea can be resized vertically
- [ ] "Active" badge appears in the header when text is entered
- [ ] No transparency issues
- [ ] Help text (💡) is visible below

**Expected result:** The textarea should work smoothly with a solid background, and the "Active" badge should appear in the section header when you add vocabulary.

---

### 6. Chat Behavior Settings ✓

**How to test:**
1. Click on "💬 Chat Behavior" to expand
2. Move the "Message Grouping Window" slider
3. Toggle the "Smooth Auto-Scroll" switch

**What to check:**
- [ ] Slider moves smoothly
- [ ] Value updates in real-time (displays seconds)
- [ ] Value also updates in the accordion header
- [ ] Switch toggle works smoothly
- [ ] Background is solid, not transparent
- [ ] All text is readable

**Expected result:** Slider and switch should work smoothly with clear visual feedback and solid backgrounds.

---

### 7. Dark Mode (if enabled) ✓

**How to test:**
1. Click the theme toggle button (🌙/☀️) in the top right
2. Switch between light and dark modes

**What to check:**
- [ ] All accordion sections adapt to dark mode
- [ ] Backgrounds remain solid in dark mode
- [ ] Dropdown menu is solid dark in dark mode
- [ ] Text is readable in both modes
- [ ] Spacing remains consistent
- [ ] No transparency issues in either mode

**Expected result:** Dark mode should look just as polished as light mode, with solid backgrounds and good contrast.

---

### 8. Recording State ✓

**How to test:**
1. Click "🎤 Start Translation" button
2. Try to change settings

**What to check:**
- [ ] All inputs become disabled
- [ ] Warning banners appear (amber/yellow background)
- [ ] Warning text: "⚠️ Settings locked during recording"
- [ ] Settings are clearly indicated as locked
- [ ] Spacing remains consistent

**Expected result:** When recording, all settings should be disabled with clear warning messages, maintaining the same spacing.

---

## Visual Inspection Checklist

### Overall Layout
- [ ] Components have comfortable spacing (not cramped)
- [ ] Visual hierarchy is clear
- [ ] Sections are easy to distinguish
- [ ] Shadows add subtle depth without being distracting

### Interactive Elements
- [ ] All dropdowns appear on top of other content
- [ ] No transparency where there shouldn't be
- [ ] Hover states are visible and smooth
- [ ] Focus states are clear for keyboard navigation

### Typography
- [ ] All text is readable
- [ ] Help text is visible but not distracting
- [ ] Labels are clear and well-positioned
- [ ] Font sizes are comfortable

### Colors & Contrast
- [ ] Sufficient contrast for readability
- [ ] Status indicators (badges) are noticeable
- [ ] Warning banners stand out appropriately
- [ ] Dark mode has good contrast

---

## Known Issues (Should be Fixed)

### ✅ FIXED: Dropdown Overlapping
- **Issue:** Select dropdown was transparent and overlapping with content below
- **Fix:** Added z-index layering (z-[100]) and solid backgrounds
- **Test:** Open language dropdown and verify it's opaque and on top

### ✅ FIXED: Tight Spacing
- **Issue:** Accordion sections were too close together (only 2px apart)
- **Fix:** Increased spacing to 24px (space-y-6)
- **Test:** Visually inspect spacing between sections

### ✅ FIXED: Transparency Issues
- **Issue:** Components had semi-transparent backgrounds (bg-white/50)
- **Fix:** Changed to solid backgrounds (bg-white)
- **Test:** Verify all backgrounds are opaque

---

## Performance Checks

### Loading
- [ ] Page loads quickly
- [ ] No layout shift when accordions render
- [ ] Components render smoothly

### Interactions
- [ ] Dropdown opens/closes smoothly
- [ ] Accordions expand/collapse without jank
- [ ] Slider responds immediately
- [ ] Switch toggles instantly

### Animations
- [ ] Accordion expand/collapse is smooth (200ms)
- [ ] Dropdown fade-in/zoom is smooth
- [ ] No stuttering or lag
- [ ] Animations feel natural

---

## Browser Testing

### Recommended Browsers
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

### Mobile Testing (Optional)
- [ ] Responsive layout works
- [ ] Touch interactions work
- [ ] Dropdown is usable on mobile
- [ ] Spacing is appropriate on small screens

---

## Reporting Issues

If you find any issues, please note:
1. **What:** Describe what you see
2. **Where:** Which component/section
3. **Expected:** What should happen
4. **Actual:** What actually happens
5. **Browser:** Which browser/version
6. **Screenshot:** If possible

---

## Quick Fixes if Issues Persist

### If dropdown still overlaps:
```tsx
// In LanguageSettings.tsx, increase z-index further:
<div className="relative z-[200]">
```

### If spacing still too tight:
```tsx
// In LanguageSettings.tsx, increase spacing:
<Accordion className="w-full space-y-8">  // Change from space-y-6
```

### If backgrounds still transparent:
```tsx
// Add !important utility:
<AccordionItem className="... bg-white dark:bg-slate-800 !bg-opacity-100">
```

---

**Testing Date:** _____________
**Tester Name:** _____________
**Browser:** _____________
**Issues Found:** _____________

✅ **Status:** All fixes implemented and ready for testing!

