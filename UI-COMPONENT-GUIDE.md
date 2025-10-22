# UI Component Design Guide

## Language & Context Settings Component

### Component Structure

```tsx
<Accordion type="multiple" defaultValue={['source-languages']}>
  
  {/* Section 1 */}
  <AccordionItem value="source-languages">
    <AccordionTrigger>
      🌍 Source Languages (🇩🇪 German)
    </AccordionTrigger>
    <AccordionContent>
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem>🇩🇪 German</SelectItem>
          <SelectItem>🇺🇸 English</SelectItem>
          {/* ... more languages */}
        </SelectContent>
      </Select>
    </AccordionContent>
  </AccordionItem>

  {/* Section 2 */}
  <AccordionItem value="vocabulary">
    <AccordionTrigger>
      📚 Vocabulary & Context Hints [Active Badge]
    </AccordionTrigger>
    <AccordionContent>
      <Textarea placeholder="Enter vocabulary..." />
    </AccordionContent>
  </AccordionItem>

  {/* Section 3 */}
  <AccordionItem value="chat-behavior">
    <AccordionTrigger>
      💬 Chat Behavior (4.0s window)
    </AccordionTrigger>
    <AccordionContent>
      <Slider min={1000} max={8000} />
      <Switch checked={smoothScroll} />
    </AccordionContent>
  </AccordionItem>

</Accordion>
```

### Visual Design Principles

#### 1. **Progressive Disclosure**
- Only show what users need at any given time
- Use accordions to hide/reveal sections
- Default to most commonly used section expanded (Source Languages)

#### 2. **Visual Hierarchy**
```
Level 1: Section Headers (with icons + summary info)
Level 2: Section Content (controls and inputs)
Level 3: Help Text (small, muted color)
Level 4: Warning/Info Banners (contextual)
```

#### 3. **Color System**
```css
/* Primary Colors */
Primary Blue:    --primary: 221.2 83.2% 53.3%      /* Main actions */
Secondary Gray:  --secondary: 210 40% 96.1%        /* Backgrounds */
Muted:          --muted: 210 40% 96.1%             /* Subtle elements */

/* Semantic Colors */
Success Green:   --accent: 210 40% 96.1%           /* Active states */
Warning Amber:   bg-amber-50, border-amber-200     /* Warnings */
Info Blue:       bg-blue-100, text-blue-700        /* Info badges */

/* Text Colors */
Foreground:     --foreground: 222.2 84% 4.9%       /* Primary text */
Muted Text:     --muted-foreground: 215.4 16.3%    /* Secondary text */
```

#### 4. **Spacing System**
```
Micro:  0.25rem (1px)  - Tight spacing
Small:  0.5rem  (8px)  - Compact spacing
Medium: 1rem    (16px) - Default spacing
Large:  1.5rem  (24px) - Section spacing
XLarge: 2rem    (32px) - Major divisions
```

#### 5. **Typography Scale**
```
xs:    0.75rem   (12px) - Help text, labels
sm:    0.875rem  (14px) - Body text, form inputs
base:  1rem      (16px) - Primary content
lg:    1.125rem  (18px) - Section headers
xl:    1.25rem   (20px) - Major headers
```

### Component Patterns

#### Pattern 1: Collapsible Section with Status
```tsx
<AccordionItem value="section-id" className="border rounded-lg mb-2 px-4 bg-white/50">
  <AccordionTrigger className="hover:no-underline">
    <div className="flex items-center gap-2">
      <span className="text-lg">🎨</span>
      <span className="font-semibold">Section Title</span>
      {/* Status indicator */}
      {isActive && (
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          Active
        </span>
      )}
    </div>
  </AccordionTrigger>
  <AccordionContent>
    {/* Section content */}
  </AccordionContent>
</AccordionItem>
```

#### Pattern 2: Form Field with Label and Help Text
```tsx
<div className="space-y-2">
  <Label htmlFor="field-id" className="text-sm font-medium">
    Field Label
  </Label>
  <Input id="field-id" placeholder="Enter value..." />
  <p className="text-xs text-muted-foreground">
    💡 Help text explaining the field
  </p>
</div>
```

#### Pattern 3: Warning Banner
```tsx
{isLocked && (
  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
    <p className="text-xs text-amber-900">
      ⚠️ Settings locked during recording. Stop to change.
    </p>
  </div>
)}
```

#### Pattern 4: Range Control with Live Value
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label>Setting Name</Label>
    <span className="text-sm font-semibold text-primary">
      {value}s
    </span>
  </div>
  <Slider value={[value]} onValueChange={handleChange} />
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>Min</span>
    <span>Max</span>
  </div>
</div>
```

#### Pattern 5: Toggle with Description
```tsx
<div className="flex items-center justify-between space-x-4 p-3 bg-slate-50 rounded-md">
  <div className="space-y-0.5">
    <Label htmlFor="toggle-id" className="text-sm font-medium cursor-pointer">
      Toggle Label
    </Label>
    <p className="text-xs text-muted-foreground">
      Description of what this toggle does
    </p>
  </div>
  <Switch id="toggle-id" checked={value} onCheckedChange={handleChange} />
</div>
```

### Interaction States

#### Hover States
- Accordion triggers: Subtle underline on hover
- Buttons: Slight opacity change (0.9)
- Select items: Background color change (accent color)

#### Focus States
- Inputs: Blue ring (--ring color)
- Buttons: Blue ring with offset
- Selects: Blue ring when opened

#### Disabled States
- Opacity: 0.5
- Cursor: not-allowed
- Color: Muted gray
- Warning banner appears explaining why

#### Active States
- Accordion items: Chevron rotates 180°
- Select items: Checkmark icon appears
- Switches: Background color changes to primary

### Accessibility Features

1. **Keyboard Navigation**
   - All interactive elements are keyboard accessible
   - Tab order follows logical flow
   - Enter/Space to activate buttons
   - Arrow keys for selects and sliders

2. **ARIA Attributes**
   - Labels properly associated with inputs
   - Accordion state communicated to screen readers
   - Disabled states announced

3. **Visual Indicators**
   - Clear focus rings
   - High contrast text
   - Icon + text for important actions
   - Status badges for state communication

4. **Responsive Text**
   - Minimum font size: 12px (0.75rem)
   - Line height: 1.5 for body text
   - Adequate spacing between clickable elements (44px min)

### Animation & Transitions

```css
/* Accordion Animation */
animate-accordion-down: 0.2s ease-out
animate-accordion-up: 0.2s ease-out

/* Hover Transitions */
transition: all 0.2s ease

/* Focus Ring */
transition: ring 150ms ease-in-out
```

### Responsive Behavior

```css
/* Mobile: Full width, stacked */
@media (max-width: 640px) {
  - Accordion takes full width
  - Controls stack vertically
  - Touch-friendly hit areas (min 44px)
}

/* Tablet: Comfortable spacing */
@media (min-width: 641px) and (max-width: 1024px) {
  - Slightly wider controls
  - Better use of horizontal space
}

/* Desktop: Optimal layout */
@media (min-width: 1025px) {
  - Full feature set visible
  - Side-by-side layouts where appropriate
}
```

### Best Practices

#### DO ✅
- Use icons consistently (emoji or lucide-react)
- Provide help text for complex features
- Show current values in headers
- Disable controls with explanations
- Use semantic color coding
- Maintain consistent spacing
- Group related controls

#### DON'T ❌
- Don't hide critical information
- Don't use color alone to convey meaning
- Don't create deep nesting (max 3 levels)
- Don't forget loading/error states
- Don't ignore mobile users
- Don't overcomplicate simple actions

### Component Reusability

The patterns established here can be applied to:
- ✅ **VADSettings** - Similar accordion structure
- ✅ **SentenceSettings** - Range slider + toggles
- ✅ **ExportControls** - Button groups with descriptions
- ✅ **PerformanceSettings** - Advanced controls with warnings
- ✅ **LatencyMetrics** - Data display with accordions

---

**Last Updated**: October 22, 2025
**Design System**: Shadcn UI + Tailwind CSS v4
**Status**: Living Document

