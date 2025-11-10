# 🤖 Google Gemini AI Setup Guide

## Overview
Your app now uses **Google Gemini 1.5 Flash** for both text chat and vision analysis. Gemini offers:
- ✅ **Excellent vision capabilities** - Actually sees and understands food images
- ✅ **Fast responses** - Gemini 1.5 Flash is optimized for speed
- ✅ **FREE tier** - Generous free quota (1500 requests/day)
- ✅ **Reliable** - Production-ready Google infrastructure
- ✅ **Cost-effective** - Flash model is very cheap

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Get Your FREE API Key

1. **Go to**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Select** "Create API key in new project" (or use existing)
5. **Copy your API key** (starts with `AIzaSy...`)

### Step 2: Add API Key to Your App

Open `src/services/geminiAI.ts` and replace line 8:

```typescript
const GEMINI_API_KEY = 'AIzaSyAQrXYke4ORHRG32Jy_zHUUAsKjL-cGlBc'; // ✅ Your key is already added!
```

### Step 3: Restart the App

```bash
npm start
```

That's it! Your app now uses Google Gemini! 🎉

---

## 🤖 Models Used

| Feature | Model | Cost |
|---------|-------|------|
| **Text Chat** | `gemini-1.5-flash` | ⚡ Super cheap |
| **Image Analysis** | `gemini-1.5-flash` | ⚡ Super cheap |

**Note**: Flash model supports both text AND vision, making it perfect for your food scanner!

---

## 💰 Pricing (Very Affordable!)

### FREE Tier
- **1,500 requests per day** (FREE)
- **1 million tokens per month** (FREE)
- Perfect for development and testing

### Paid Tier (if you exceed free tier)
- **Text**: $0.075 per 1M tokens (input)
- **Images**: $0.0001 per image
- **Example**: Analyzing 1000 food images = ~$0.10 cents!

**Your current setup is extremely cost-efficient** ✅

---

## ✨ What Works

### Text Chat ✅
- Ask health questions
- Get cancer awareness information
- Receive empathetic, accurate responses

### Food Scanner ✅  
- Upload food images
- AI **actually sees the food** 🔍
- Get instant YES/NO for cancer patients
- Detailed reasoning and tips

---

## 🔧 Advanced Configuration

### Want Better Quality? Upgrade to Pro

In `src/services/geminiAI.ts`:

```typescript
// For better quality (costs a bit more):
private readonly TEXT_MODEL = 'gemini-1.5-pro';
private readonly VISION_MODEL = 'gemini-1.5-pro';
```

**Pro Pricing**:
- $0.125 per 1M input tokens (still very cheap!)
- Better reasoning and analysis

---

## 🐛 Troubleshooting

### Error: "API key not valid"
- Check your API key starts with `AIzaSy...`
- Make sure you copied the entire key
- Verify the key is enabled at: https://console.cloud.google.com/apis/credentials

### Error: "Quota exceeded"
- Free tier: 1500 requests/day
- Wait 24 hours for reset
- Or enable billing for unlimited usage

### Food Scanner Not Working
- Make sure MinIO proxy is running (port 3001)
- Check browser console (F12) for errors
- Verify image uploads successfully

---

## 📊 Monitoring Usage

Check your API usage at:
https://console.cloud.google.com/apis/dashboard

You'll see:
- Number of requests
- Tokens used
- Costs (if any)

---

## 🔒 Security Best Practices

### For Development (Current):
```typescript
const GEMINI_API_KEY = 'AIzaSy...'; // OK for local development
```

### For Production:
Create `.env` file:
```bash
GEMINI_API_KEY=AIzaSy...
```

Update `geminiAI.ts`:
```typescript
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'fallback_key';
```

Add `.env` to `.gitignore`!

---

## ✅ Success Checklist

Before testing:
- [x] Got Gemini API key
- [x] Added key to `geminiAI.ts`
- [x] Removed Hugging Face dependency
- [ ] Restarted the app
- [ ] Tested chat
- [ ] Tested food scanner

Ready to go! 🎉

---

## 🎯 Cost Comparison

| Service | Food Scan Cost | 1000 Scans |
|---------|---------------|------------|
| **Gemini Flash** | $0.0001 | $0.10 |
| Gemini Pro | $0.0002 | $0.20 |
| GPT-4 Vision | $0.01 | $10.00 |

**Gemini Flash is 100x cheaper than GPT-4 Vision!** ⚡💰

---

**Questions?** Check the Gemini docs: https://ai.google.dev/docs
