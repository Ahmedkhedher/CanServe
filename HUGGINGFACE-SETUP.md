# 🤗 Hugging Face Setup Guide

## Overview
Your app now uses Hugging Face's free inference API instead of Google Gemini. Hugging Face offers:
- ✅ **Completely FREE** (no credit card required)
- ✅ **No expiration** on free tier
- ✅ **Generous rate limits**
- ✅ **1000+ models** to choose from
- ✅ **Vision support** (image analysis)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your FREE API Key

1. **Go to Hugging Face**: https://huggingface.co/join
2. **Sign up for free** (use email or GitHub)
3. **Verify your email**
4. **Go to Settings > Access Tokens**: https://huggingface.co/settings/tokens
5. **Click "New token"**
   - Name: `cancer-awareness-app`
   - Type: **Read**
   - Click **Generate**
6. **Copy your token** (starts with `hf_...`)

### Step 2: Add API Key to Your App

Open `src/services/geminiAI.ts` and replace:

```typescript
const HUGGINGFACE_API_KEY = 'hf_YOUR_API_KEY_HERE';
```

With your actual token:

```typescript
const HUGGINGFACE_API_KEY = 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### Step 3: Restart the App

```bash
npm start
```

That's it! Your app now uses Hugging Face! 🎉

---

## 🤖 Models Used

| Feature | Model | Description |
|---------|-------|-------------|
| **Text Chat** | `meta-llama/Llama-3.2-11B-Vision-Instruct` | Meta's Llama 3.2 (11B params) |
| **Image Captioning** | `Salesforce/blip-image-captioning-large` | BLIP image description |
| **Image Analysis** | `meta-llama/Llama-3.2-11B-Vision-Instruct` | Vision-enabled Llama |

---

## 📊 Free Tier Limits

| Limit | Amount |
|-------|--------|
| **Rate Limit** | ~1,000 requests/hour |
| **Concurrent Requests** | 10 |
| **Cost** | **FREE** (forever) |
| **Storage** | Unlimited |
| **Models** | 1000+ available |

**Note:** If you hit rate limits, they reset automatically within an hour.

---

## 🔧 Alternative Models

You can easily switch models by updating the constants in `geminiAI.ts`:

### For Faster Responses (Smaller Models):
```typescript
private readonly TEXT_MODEL = 'meta-llama/Llama-3.2-3B-Instruct';
```

### For Better Quality (Larger Models):
```typescript
private readonly TEXT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
```

### For Different Vision Models:
```typescript
// Option 1: Better captions
model: 'Salesforce/blip2-opt-2.7b'

// Option 2: More detailed
model: 'nlpconnect/vit-gpt2-image-captioning'

// Option 3: Medical-focused
model: 'microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224'
```

---

## ✨ Features Working

✅ **Text Chat** - Ask health questions  
✅ **Image Upload** - Upload food/medical images  
✅ **Image Analysis** - AI describes and analyzes images  
✅ **Streaming Responses** - Real-time response generation  
✅ **Context Awareness** - Remembers you're using health app  

---

## 🐛 Troubleshooting

### Error: "Invalid API token"
- Check your token starts with `hf_`
- Make sure you copied the entire token
- Token type must be "Read" (not "Write")

### Error: "Model not found"
- Some models require acceptance of terms
- Go to model page on Hugging Face and click "Agree"
- Example: https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct

### Slow Responses
- First request may be slow (cold start)
- Subsequent requests are faster
- Consider switching to smaller model

### Rate Limit Errors
- Free tier: ~1000 requests/hour
- Wait 60 minutes or upgrade to PRO
- Or create multiple accounts (not recommended for production)

---

## 🎯 Advantages vs Gemini

| Feature | Hugging Face | Gemini |
|---------|-------------|--------|
| **Cost** | FREE forever | $5 credit (expires) |
| **Rate Limit** | 1000/hour | 15/minute |
| **Vision** | ✅ Yes | ✅ Yes |
| **Setup** | No credit card | Credit card required |
| **Models** | 1000+ choices | Fixed models |
| **Open Source** | ✅ Yes | ❌ No |

---

## 🔐 Security Best Practices

### For Development (Current):
```typescript
const HUGGINGFACE_API_KEY = 'hf_xxxxx'; // OK for local dev
```

### For Production:
Create `.env` file:
```bash
HUGGINGFACE_API_KEY=hf_xxxxx
```

Update `geminiAI.ts`:
```typescript
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || 'fallback_key';
```

---

## 📚 Resources

- **Hugging Face Hub**: https://huggingface.co/models
- **Inference API Docs**: https://huggingface.co/docs/api-inference
- **Rate Limits**: https://huggingface.co/pricing
- **Model Cards**: Detailed info on each model

---

## 🚀 Upgrade Options

**Hugging Face PRO** ($9/month):
- ✅ 10x higher rate limits
- ✅ Priority access to models
- ✅ Faster inference
- ✅ Advanced analytics

**Hugging Face Enterprise** (Custom):
- ✅ Private models
- ✅ Dedicated infrastructure
- ✅ SLA guarantees
- ✅ Custom fine-tuning

---

## ✅ Success Checklist

Before testing:
- [ ] Created Hugging Face account
- [ ] Generated API token (starts with `hf_`)
- [ ] Updated `HUGGINGFACE_API_KEY` in `geminiAI.ts`
- [ ] Restarted the app (`npm start`)
- [ ] Opened app in browser (http://localhost:8081)

Ready to test! 🎉

---

**Questions?** Check the Hugging Face Discord: https://discord.com/invite/JfAtkvEtRb
