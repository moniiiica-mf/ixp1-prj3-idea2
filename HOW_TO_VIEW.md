# How to View Your Nightmare Experience

Your project has been completely updated with:
- ✅ Real reflective mirror (shows your actual reflection)
- ✅ Real physical door with light leaking through
- ✅ Realistic cat (3D model with glowing eyes)
- ✅ Physical room with breathing walls
- ✅ Visual ending animations (no text!)

## OPTION 1: Run Locally (Fastest)

### Using Python:
```bash
cd /home/user/ixp1-prj3-idea2
python3 -m http.server 8000
```

### Using Node.js:
```bash
cd /home/user/ixp1-prj3-idea2
npx http-server -p 8000
```

Then open in your browser: **http://localhost:8000**

### IMPORTANT - After Opening:
1. **Do a HARD REFRESH** to clear cache:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Or open in **Incognito/Private Mode** to avoid cache issues

---

## OPTION 2: Deploy to GitHub Pages

1. Go to your repo: **github.com/moniiiica-mf/ixp1-prj3-idea2**
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source", select: **GitHub Actions**
4. Your site will be live at:
   ```
   https://moniiiica-mf.github.io/ixp1-prj3-idea2/
   ```

---

## What You Should See:

### When You Start:
- Dark enclosed room with breathing walls
- Particles floating in the air
- Dim ceiling light

### Walk Around (WASD):
- **Left wall**: MIRROR - you'll see yourself reflected!
- **Back wall**: DOOR - warm light glowing from underneath
- **Right corner**: CAT - with 3 glowing green eyes (appears after 3 seconds)

### Interact (Press E):
- **Mirror**: Camera pulls you in, ripples, fades to black, you respawn
- **Cat**: Eyes glow bright, cat lunges at you, red flash, shock, respawn
- **Door**: Door swings open, blinding white light floods in, peaceful fade

---

## Troubleshooting:

**"I see the old version"**
→ Clear browser cache or use Incognito mode

**"Nothing appears"**
→ Check browser console (F12) for errors
→ Make sure you're using a modern browser (Chrome/Firefox/Edge)

**"Mirror doesn't reflect"**
→ This is normal! The Reflector takes a moment to initialize

**"Cat doesn't appear"**
→ Wait 3 seconds after clicking "Wake Up"
→ Or the GLTF model is loading (fallback will appear)

---

## Controls:
- **WASD** - Move (slow, dreamlike pace)
- **Mouse** - Look around
- **Click** - Lock cursor for looking
- **E** - Interact with objects
- **ESC** - Unlock cursor

Enjoy the nightmare! 🌙
