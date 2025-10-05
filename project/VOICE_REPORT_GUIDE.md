# 🎤 Voice-to-Incident Reporting - Complete Guide

## 🎯 Overview

Your Web-Slinger Dispatch app now supports **hands-free voice incident reporting** powered by **Gemini AI**!

### **How It Works:**

1. **Driver speaks**: "A tree is blocking the road on Cooper Street!"
2. **AI parses**: Gemini extracts incident type, description, and location
3. **Geocoding**: Converts street names to GPS coordinates
4. **Confirmation**: Shows parsed data for user review
5. **Submit**: Incident appears on live map instantly!

---

## 🚀 Quick Start

### **Your API Key is Already Configured!** ✅

The `.env` file already has your Gemini API key set up:
```
VITE_GEMINI_API_KEY=AIzaSyBd5i219TQ2Urme8GKq2JoThoPyWzpdHwY
```

### **Try It Now:**

1. **Start the dev server** (if not running):
   ```powershell
   npm run dev
   ```

2. **Open the app** in your browser (usually `http://localhost:5173`)

3. **Click the microphone button** (floating button on the right side)

4. **Speak your report**:
   - "There's a fire at the gas station on Main Street"
   - "Car accident at 5th and Oak intersection"
   - "A tree is blocking the road on Cooper Street"
   - "Someone got hurt near the shopping mall"

5. **Review the parsed data** in the confirmation modal

6. **Submit** to add it to the live map!

---

## 🎤 Voice Commands Examples

The AI can understand natural language! Try these:

### **Road Hazards:**
- "A tree is blocking the road on Cooper Street"
- "There's a pothole on Highway 77"
- "Debris on the northbound lane of Main Avenue"

### **Accidents:**
- "Car accident at the intersection of 5th and Oak"
- "Two-car collision near the mall"
- "Vehicle crash on Interstate 35"

### **Fire:**
- "Fire at the gas station on Main Street"
- "Building is burning on Elm Avenue"
- "Smoke coming from apartment complex"

### **Medical:**
- "Someone got hurt near the shopping center"
- "Person needs medical help at the park"
- "Injury at the construction site"

### **Crime:**
- "Robbery in progress at the convenience store"
- "Suspicious activity on Baker Street"

---

## 🛠️ What Was Implemented

### **1. New Files Created:**

#### **`src/lib/geminiService.ts`**
- Parses voice input using Gemini AI
- Extracts: incident type, description, location, severity, confidence
- Includes fallback keyword-based parsing
- Function: `parseVoiceToIncident()`

#### **`src/lib/geocodingService.ts`**
- Converts location names to GPS coordinates
- Uses **OpenStreetMap Nominatim** (free, no API key!)
- Smart location resolution with fallbacks
- Functions:
  - `geocodeLocation()` - Convert address to coords
  - `reverseGeocode()` - Convert coords to address
  - `resolveLocation()` - Smart resolver with user location bias

#### **`src/components/VoiceReportButton.tsx`**
- Microphone button with Web Speech API
- Records voice and shows transcription
- Handles errors gracefully
- Visual feedback during listening/processing

#### **`src/components/VoiceConfirmModal.tsx`**
- Shows AI-parsed incident data
- Displays confidence level
- Allows user to edit before submitting
- Color-coded by incident type

#### **`src/types/speech-recognition.d.ts`**
- TypeScript definitions for Web Speech API

### **2. Modified Files:**

#### **`src/components/Dashboard.tsx`**
- Added Voice Report Button to UI (floating on right side)
- Integrated VoiceConfirmModal
- Tracks user location for voice reports
- Added handler for voice incident parsing

---

## 🧠 How Gemini AI Works

### **The Parsing Process:**

1. **User speaks** → Web Speech API converts to text
2. **Text sent to Gemini** with this prompt:
   ```
   "You are an emergency dispatch AI assistant. 
   Parse this incident report: 'A tree is blocking the road on Cooper Street!'
   
   Extract:
   - incident_type
   - description
   - location_name
   - severity
   - confidence (0-1)"
   ```
3. **Gemini returns JSON**:
   ```json
   {
     "incident_type": "hazard",
     "description": "Tree blocking road",
     "location_name": "Cooper Street",
     "severity": "medium",
     "confidence": 0.95
   }
   ```
4. **Geocoding** converts "Cooper Street" → lat/lng
5. **User confirms** → Submit to Supabase

### **Confidence Levels:**

- **90-100%**: Very clear report → High confidence
- **70-89%**: Clear type and location → Medium-high
- **50-69%**: Vague location/type → Medium
- **Below 50%**: Unclear → Low (shows warning)

---

## 🌍 Geocoding Service

Uses **OpenStreetMap Nominatim**:
- ✅ **Free** (no API key required)
- ✅ **Accurate** for most locations
- ✅ **Biased** towards user's current location
- ✅ **Fallback** to user GPS if location unclear

### **Example Flow:**

1. Voice: "Fire on Main Street"
2. Gemini extracts: location_name = "Main Street"
3. Geocoding searches near user's location
4. Returns: "Main Street, Dallas, TX" → 32.7767, -96.7970
5. If no match: Falls back to user's GPS coordinates

---

## 🎨 UI Components

### **Voice Report Button:**
- **Location**: Bottom-right of map (above Quick Report button)
- **States**:
  - 🎤 **Ready**: Blue gradient button
  - 🔴 **Listening**: Red pulsing button
  - ⏳ **Processing**: Gray with spinner
- **Error handling**: Shows error messages below button

### **Confirmation Modal:**
- Shows AI-parsed data
- Confidence badge (color-coded)
- Edit button to modify details
- Color-coded by incident type
- Warning for low-confidence parses

---

## 🔧 Customization Options

### **Change Voice Language:**

Edit `VoiceReportButton.tsx`:
```typescript
recognitionInstance.lang = "es-ES"; // Spanish
// or "vi-VN" for Vietnamese
// or "en-US" for English (default)
```

### **Adjust AI Prompt:**

Edit `geminiService.ts` to customize how AI interprets reports:
```typescript
const prompt = `You are a [YOUR CUSTOM STYLE].
Extract...`;
```

### **Add More Incident Types:**

1. Update `supabase.ts` types
2. Update Gemini prompt in `geminiService.ts`
3. Update `VoiceConfirmModal.tsx` labels and colors

---

## 🐛 Troubleshooting

### **"Voice input not supported in this browser"**
- Use Chrome, Edge, or Safari
- Firefox has limited support

### **"Microphone access denied"**
- Allow microphone permission in browser
- Check browser settings

### **"Failed to process voice input"**
- Check that Gemini API key is valid
- Check browser console for errors
- Try speaking more clearly

### **"Could not determine location"**
- Speak a specific street name
- Enable GPS/location services
- Try: "at my current location"

### **Low Confidence Warning**
- Speak more clearly with specific details
- Include street names
- Use keywords: "fire", "accident", "blocking", etc.

---

## 📊 Testing

### **Test with Console:**

```javascript
// Test voice parsing (open browser console)
import { parseVoiceToIncident } from './src/lib/geminiService';

const result = await parseVoiceToIncident(
  "A tree is blocking the road on Cooper Street"
);
console.log(result);
```

### **Test Geocoding:**

```javascript
import { geocodeLocation } from './src/lib/geocodingService';

const result = await geocodeLocation("Cooper Street");
console.log(result);
```

---

## 💡 Tips for Best Results

### **For Users:**

1. **Be specific**: "Fire on Main Street" > "Something's wrong"
2. **Include location**: Mention street names or landmarks
3. **Speak clearly**: Pause briefly before speaking
4. **Review before submit**: Check the confirmation modal
5. **Enable GPS**: Helps with location accuracy

### **For Developers:**

1. **Monitor confidence scores**: Log low-confidence reports
2. **Collect feedback**: Track which reports need editing
3. **Improve prompts**: Refine Gemini prompt based on failures
4. **Add voice feedback**: Implement text-to-speech confirmation

---

## 🚀 Future Enhancements

Possible additions:
- Multi-language support (Spanish, Vietnamese)
- Voice playback of confirmation
- Photo upload after voice report
- Auto-classify severity based on keywords
- Integration with ElevenLabs for voice announcements
- Officer voice dispatch system
- Real-time translation
- Voice-to-voice communication

---

## 📚 API Documentation

### **Gemini AI:**
- [Get API Key](https://makersuite.google.com/app/apikey)
- [Documentation](https://ai.google.dev/docs)
- Free tier: 60 requests/minute

### **OpenStreetMap Nominatim:**
- [Documentation](https://nominatim.org/release-docs/develop/api/Overview/)
- Free, no API key needed
- Rate limit: 1 request/second

### **Web Speech API:**
- [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Built-in browser feature
- Supported: Chrome, Edge, Safari

---

## ✅ Complete Feature List

- ✅ Voice input with Web Speech API
- ✅ AI-powered parsing with Gemini
- ✅ Smart geocoding with OSM Nominatim
- ✅ Confidence scoring
- ✅ User confirmation modal
- ✅ Edit capability before submission
- ✅ Real-time map integration
- ✅ Error handling with fallbacks
- ✅ GPS location fallback
- ✅ Visual feedback (listening/processing)
- ✅ Accessibility support
- ✅ Mobile-responsive UI

---

## 🎉 Success!

Your Web-Slinger Dispatch app now has **state-of-the-art voice incident reporting**!

Drivers can report incidents completely hands-free while driving. The AI handles the complex parsing, and the geocoding service ensures accurate locations.

**Try it now!** Click the microphone button and say:
> "A tree is blocking the road on Cooper Street!"

🚀 Happy reporting!
