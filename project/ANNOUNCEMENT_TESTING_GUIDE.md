# Voice Announcement Testing Guide 🔊

## Overview
Your app now has **Gemini AI + ElevenLabs voice announcements** that speak when new incidents are reported!

## How It Works
1. **New incident is created** (via voice, map click, or quick report)
2. **Gemini AI generates** a professional 2-3 sentence paragraph report
3. **ElevenLabs speaks** the announcement to all users

---

## Testing the Announcement System

### Method 1: Test Button (Fastest) ⚡
1. **First, create at least one incident** (using voice, map click, or quick report)
2. Look for the **purple "Test Announcement" button** on the right side of the screen
3. Click it
4. It will **fetch the most recent incident from your database** and announce it
5. You should hear a professionally generated voice announcement about that real incident

**Note:** If no incidents exist in your database, it will use mock data as fallback.

### Method 2: Create Real Incident 🎤
1. Click the **microphone button** and say:
   ```
   "There's a car accident on Cooper Street!"
   ```
2. Confirm the incident in the modal
3. **Wait 2-3 seconds** - you should hear Gemini's announcement

### Method 3: Map Click 🗺️
1. Click anywhere on the map
2. Fill out the incident form
3. Submit it
4. **Within 30 seconds**, all users should hear the announcement

---

## What to Check ✅

### Console Logs
Open browser DevTools (F12) and look for:
```
🧪 Testing announcement system - fetching latest incident from database...
✅ Found latest incident: { id: '...', type: 'fire', location: '...', created: '...' }
🎙️ Generating incident report with Gemini AI...
📝 Generated report: [your AI-generated announcement text]
🔊 Converting text to speech with ElevenLabs...
✅ Announcement played successfully
```

### Expected Behavior
- ✅ Announcement plays **within 3-5 seconds** of incident creation
- ✅ Only **new incidents** (created < 30 seconds ago) are announced
- ✅ Each incident is announced **only once** (no duplicates)
- ✅ Professional dispatcher voice (clear, authoritative)

---

## API Configuration

### Required Environment Variables
Make sure your `.env` file has:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Fallback Behavior
If API keys are missing:
- **Gemini**: Uses template format "Attention all units: [type] at [location]"
- **ElevenLabs**: Falls back to browser's built-in text-to-speech

---

## Voice Settings

### Default Voice
- **Voice ID**: `GBv7mTt0atIp3Br8iCZE` (Thomas - Professional Dispatcher)
- **Model**: `eleven_multilingual_v2`
- **Voice Settings**:
  - Stability: 0.5 (balanced)
  - Similarity Boost: 0.75 (natural)
  - Style: 0.5 (moderate expression)

### Changing the Voice
Edit `src/lib/incidentAnnouncer.ts`:
```typescript
const voiceId = "YOUR_VOICE_ID_HERE"; // Default: GBv7mTt0atIp3Br8iCZE
```

Popular ElevenLabs voices:
- `GBv7mTt0atIp3Br8iCZE` - Thomas (Professional Male)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (Professional Female)
- `AZnzlk1XvdvUeBnXmlld` - Domi (Energetic Female)

---

## Troubleshooting 🔧

### No Sound Playing?
1. **Check console** for errors
2. **Verify API keys** are in `.env`
3. **Check browser volume** and permissions
4. Try the **Test Announcement** button first
5. Open DevTools → Console → Look for error messages

### Announcement Plays Multiple Times?
- This shouldn't happen - there's duplicate prevention
- If it does, check console for "🔄 Already announced incident" messages
- Report as bug if persistent

### Voice Quality Issues?
- **Robotic/Choppy**: ElevenLabs API might be down, check fallback to browser speech
- **Too Fast/Slow**: Adjust `rate` in `useBrowserSpeech()` function
- **Wrong Accent**: Change `voiceId` to different ElevenLabs voice

### Delay Before Announcement?
- **2-3 seconds is normal** (Gemini generation + ElevenLabs conversion)
- **>10 seconds**: Check network tab for slow API responses
- **Never plays**: Check if incident was created >30 seconds ago (won't announce old incidents)

---

## Testing Checklist

- [ ] Test button works and plays voice
- [ ] Voice report creates incident AND plays announcement
- [ ] Map click report plays announcement
- [ ] Quick report button plays announcement
- [ ] Announcement only plays once per incident
- [ ] Console shows successful generation logs
- [ ] Voice is clear and professional
- [ ] No errors in browser console
- [ ] Multiple users hear the same announcement (test with 2 browser tabs)

---

## Advanced Testing

### Test with Multiple Incident Types
Try creating different incident types to hear varied announcements:
```
"Fire on Main Street!"           → Fire-related announcement
"Car crash on Cooper Street!"    → Accident announcement  
"Medical emergency at UTA!"      → Medical emergency tone
"Suspicious activity reported!"  → Crime-related language
```

### Test Real-Time Broadcasting
1. Open **two browser tabs** with your app
2. In Tab 1: Create an incident
3. In Tab 2: Should hear the announcement within 5 seconds
4. This tests Supabase real-time + announcement integration

---

## Performance Notes

### Expected Timing
- **Gemini Generation**: 0.5-1.5 seconds
- **ElevenLabs TTS**: 1-2 seconds
- **Total Delay**: 2-4 seconds from incident creation

### Optimization Tips
- Announcements run **asynchronously** (non-blocking)
- Error handling prevents crashes if API fails
- Fallback mechanisms ensure voice always plays

---

## Need Help?

If announcements aren't working:
1. Check `TROUBLESHOOTING.md` for general issues
2. Verify `.env` has both API keys
3. Test with the purple **Test Announcement** button
4. Check browser console for specific error messages
5. Try incognito mode to rule out extension conflicts

**Happy Testing! 🎉**
