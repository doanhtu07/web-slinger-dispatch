# 🔧 Voice Report Troubleshooting Guide

## Issue: No Incident Report After Speech

### Step-by-Step Debugging

#### **Step 1: Open Browser Console**
1. Press **F12** to open Developer Tools
2. Click the **Console** tab
3. Keep it open while testing

---

#### **Step 2: Test Voice Report**
1. Click the **microphone button**
2. Click **"Debug ▶"** to open debug panel
3. Speak: "A tree is blocking the road on Cooper Street"
4. Watch both the debug panel AND console

---

#### **Step 3: Check Console Logs**

You should see these messages in order:

```
✓ [Voice Debug] Voice Recognition Started
✓ [Voice Debug] Voice Captured
✓ [Voice Debug] Gemini AI Parsing
✓ [Voice Debug] Gemini AI Response
✓ [Voice Debug] Geocoding
✓ [Voice Debug] Geocoding Success
✓ [Voice Debug] Opening Confirmation Modal
🎤 Calling onIncidentParsed with: { incident_type: "hazard", ... }
🎤 Voice incident parsed: { incident_type: "hazard", ... }
✅ Voice confirm modal should now open
🔔 VoiceConfirmModal render - isOpen: true, parsedData: { ... }
```

---

#### **Step 4: Identify Where It Stops**

##### **If it stops at "Voice Recognition Started"**
**Problem**: Microphone not working
**Solution**: 
- Check microphone permissions
- Try a different browser (Chrome recommended)
- Check if microphone is connected

##### **If it stops at "Gemini AI Parsing"**
**Problem**: Gemini API issue
**Solutions**:
- Check console for error details
- Verify Gemini API key in `.env` file
- Check if API key is valid: https://makersuite.google.com/app/apikey
- Try: `console.log(import.meta.env.VITE_GEMINI_API_KEY)` in console

##### **If it stops at "Geocoding"**
**Problem**: Location resolution failed
**Solutions**:
- Check console for geocoding errors
- Try speaking a more specific address
- Enable GPS/location services
- Try: "at my current location"

##### **If you see "Opening Confirmation Modal" but no modal appears**
**Problem**: Modal not rendering
**Solutions**:
- Check console for React errors
- Check if `voiceConfirmData` is set (see console log)
- Look for z-index CSS conflicts
- Check if another modal is blocking it

##### **If modal appears but submission fails**
**Problem**: Supabase insert error
**Solutions**:
- Check console for "Supabase error"
- Verify you're logged in
- Check Supabase table permissions
- Check database schema matches

---

#### **Step 5: Common Issues**

##### **1. No Gemini API Key**
**Console shows**: `Gemini API key not configured`
**Fix**: 
```bash
# Check .env file
cat .env

# Should see:
# VITE_GEMINI_API_KEY=AIzaSy...
```

##### **2. Microphone Permission Denied**
**Console shows**: `Permission Denied`
**Fix**: 
- Click lock icon in address bar
- Allow microphone access
- Reload page

##### **3. Network Error**
**Console shows**: `Failed to fetch` or `Network error`
**Fix**:
- Check internet connection
- Check if Gemini API is accessible
- Try different network

##### **4. Modal Hidden Behind Map**
**Symptom**: You hear success but don't see modal
**Fix**:
- Check browser console for modal logs
- Look for modal at very top of screen
- Try scrolling up
- Check CSS z-index

---

### **Quick Test Commands**

Run these in browser console to test components:

#### Test Gemini API:
```javascript
import { parseVoiceToIncident } from './src/lib/geminiService';
const result = await parseVoiceToIncident("tree blocking road");
console.log(result);
```

#### Test Geocoding:
```javascript
import { geocodeLocation } from './src/lib/geocodingService';
const result = await geocodeLocation("Cooper Street");
console.log(result);
```

#### Check API Key:
```javascript
console.log("Gemini Key:", import.meta.env.VITE_GEMINI_API_KEY);
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
```

---

### **Expected Behavior**

1. **Click microphone** → Debug shows "Listening..."
2. **Speak** → "You said: ..." box appears with your text
3. **Processing** → Debug shows all steps turning green (✓)
4. **Modal appears** → Large modal with parsed incident details
5. **Click "Submit Report"** → Alert: "Incident reported successfully!"
6. **Check map** → New marker should appear

---

### **If All Else Fails**

1. **Clear browser cache** and reload
2. **Check .env file** has all required keys
3. **Restart dev server**: `npm run dev`
4. **Try incognito mode** (eliminates extension conflicts)
5. **Check database** directly in Supabase dashboard
6. **Look for React errors** in console (red text)

---

### **Send Debug Info**

If still not working, copy this info:

```
Browser: Chrome/Firefox/Safari/Edge
Error in console: [paste error here]
Last debug step reached: [e.g., "Geocoding Success"]
Modal appeared: Yes/No
Submit clicked: Yes/No
Error message: [if any]
```

---

### **Most Common Issue**

**99% of the time it's one of these:**

1. ❌ Gemini API key missing/invalid → Check `.env`
2. ❌ Not logged in → Login first
3. ❌ Microphone blocked → Allow permissions
4. ❌ Modal hidden by CSS → Check z-index

---

### **Success Indicators**

✅ Debug panel shows all green checkmarks  
✅ Console shows "Voice confirm modal should now open"  
✅ Console shows "VoiceConfirmModal render - isOpen: true"  
✅ Modal appears on screen  
✅ Submit button works  
✅ New marker appears on map  

---

Good luck! 🍀
