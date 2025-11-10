# 🍽️ Food Scanner - Complete Guide

## 🎯 Overview

The **Food Scanner** is an AI-powered tool that analyzes food images and provides detailed nutritional information specifically tailored for cancer patients.

## ✨ Features

### **1. Photo Upload** 📷
- Take photo with camera
- Upload from gallery
- Image preview before analysis

### **2. AI Analysis** 🤖
Using **Gemini Vision API** to identify:
- **Food Name** - Identifies the dish
- **Calories** - Estimated per serving
- **Protein** - Grams of protein
- **Carbohydrates** - Grams of carbs
- **Fat** - Grams of fat

### **3. Cancer Patient Recommendations** 💊
- ✅ **Recommended** or ⚠️ **Not Ideal** badge
- Detailed reasoning for recommendation
- Tips specific to cancer patients
- Nutritional considerations during treatment

### **4. Beautiful UI** 🎨
- Gradient background
- Clean, modern design
- Easy-to-read nutrition cards
- Color-coded recommendations

## 🚀 How to Use

### **Step 1: Access Food Scanner**
1. Open the app
2. On the **Main Screen**, tap the **🍽️ Food Scanner** button
3. Food Scanner screen opens

### **Step 2: Upload Photo**
1. Tap "Take or Upload Photo"
2. Choose:
   - **Camera** - Take a photo now
   - **Gallery** - Select existing photo
3. Edit/crop if needed
4. Photo appears on screen

### **Step 3: Analyze**
1. Tap the **"🔍 Analyze Food"** button
2. Wait for upload (1-3 seconds)
3. Wait for AI analysis (3-10 seconds)
4. Results appear!

### **Step 4: View Results**
See detailed analysis including:
- **Food Name & Image**
- **Nutritional Grid**:
  - Calories (kcal)
  - Protein (g)
  - Carbs (g)
  - Fat (g)
- **Recommendation Badge**
  - Green ✅ = Recommended
  - Yellow ⚠️ = Not Ideal
- **Full Analysis** with markdown formatting
- **Tips** for cancer patients

### **Step 5: Scan Another**
- Tap "Scan Another Food" button
- Start over with new photo

## 📊 Example Analysis

### **Input:**
📷 Photo of grilled chicken salad

### **Output:**

**Food Name:** Grilled Chicken Salad

**Nutritional Information:**
```
Calories: 350 kcal
Protein: 35g
Carbs: 25g
Fat: 12g
```

**Recommendation:** ✅ **Recommended** for Cancer Patients

**Reasoning:**
This meal is excellent for cancer patients due to:
- **High protein content** (35g) supports tissue repair and immune function
- **Lean protein** from grilled chicken is easy to digest
- **Fresh vegetables** provide vitamins, minerals, and antioxidants
- **Balanced macros** with adequate carbs for energy
- **Low in unhealthy fats** - mostly from heart-healthy sources

**Tips:**
- Add avocado for healthy fats and calories if weight maintenance is a concern
- Ensure chicken is thoroughly cooked to avoid food safety issues during treatment
- If experiencing nausea, eat smaller portions throughout the day
- Stay hydrated - pair with water or herbal tea

*Always consult your oncologist or dietitian about specific dietary needs during treatment.*

## 🎨 Visual Design

### **Main Screen Button:**
- 🍽️ **Food Scanner** - Yellow/gold background
- Located below the main 3 buttons
- Easy to find and access

### **Food Scanner Screen:**
- **Gradient Background** - Soft blue gradient
- **White Cards** - Clean nutrition display
- **Color-Coded Badges**:
  - Green = Recommended
  - Yellow = Caution

### **Nutrition Grid:**
4-box layout showing:
```
┌─────────┬─────────┐
│ Calories│ Protein │
├─────────┼─────────┤
│  Carbs  │   Fat   │
└─────────┴─────────┘
```

## 🔧 Technical Details

### **Files Created:**
1. `src/screens/FoodScanScreen.tsx` - Main screen component
2. `FOOD-SCANNER-GUIDE.md` - This documentation

### **Technologies Used:**
- **Gemini Vision API** - Image analysis
- **MinIO Storage** - Image upload
- **React Native** - Mobile app framework
- **Markdown Renderer** - Formatted text display

### **API Integration:**
```typescript
// Upload image to MinIO
const imageUrl = await uploadImage(selectedImage, 'food-scans', filename);

// Analyze with Gemini Vision
const response = await geminiAI.sendMessageWithImage(prompt, imageUrl);

// Parse and display results
const parsed = parseAnalysis(response);
```

### **Data Flow:**
```
1. User selects photo
2. Upload to MinIO (1-3 sec)
3. Send to Gemini Vision (3-10 sec)
4. Parse AI response
5. Display formatted results
```

## 🎯 Use Cases

### **1. Meal Planning**
**Scenario:** Planning dinner during chemotherapy

**Action:**
- Take photo of potential meals
- Check nutritional content
- See if recommended for treatment

**Result:** Make informed dietary choices

### **2. Restaurant Meals**
**Scenario:** Eating out with family

**Action:**
- Photo of restaurant dish
- Quick nutrition check
- See cancer-patient suitability

**Result:** Order confidently

### **3. Home Cooking**
**Scenario:** Preparing meals for patient

**Action:**
- Photo of prepared meal
- Verify nutritional balance
- Get tips for improvements

**Result:** Optimize home meals

### **4. Grocery Shopping**
**Scenario:** Buying prepared foods

**Action:**
- Photo of packaged meal
- Check ingredient quality
- Verify suitability

**Result:** Smart shopping decisions

## ⚠️ Important Notes

### **What It Does:**
✅ Identifies food items
✅ Estimates nutritional content
✅ Provides general recommendations
✅ Offers helpful tips
✅ Educational guidance

### **What It DOESN'T Do:**
❌ Replace medical nutrition therapy
❌ Provide exact calorie counts
❌ Replace dietitian consultations
❌ Diagnose food allergies
❌ Account for individual metabolism

### **Always Consult:**
- Oncologist
- Registered Dietitian
- Healthcare team
- For personalized nutrition plans

## 🔒 Privacy & Security

### **Data Handling:**
- **Images stored** in your local MinIO server
- **Under your control** - can be deleted
- **Sent to Google** for AI analysis only
- **Not permanently stored** by Gemini (per their policy)
- **No personal data** collected

### **Best Practices:**
- Don't include personal info in photos
- Crop to show only food
- Delete scans you don't need
- Review privacy settings

## 📱 Tips for Best Results

### **Photo Quality:**
✅ Good lighting (natural light best)
✅ Clear, focused image
✅ Food fills the frame
✅ Multiple angles if complex dish
❌ Avoid blurry photos
❌ Avoid dark images
❌ Don't over-zoom

### **Questions to Ask:**
- "Is this meal good for chemotherapy patients?"
- "How much protein is in this?"
- "Is this easy to digest during treatment?"
- "What modifications would you suggest?"

### **Context Helps:**
Add details like:
- "I'm on chemotherapy"
- "Need high protein options"
- "Struggling with nausea"
- "Need easy-to-digest meals"

## 🐛 Troubleshooting

### **Upload Fails**
**Problem:** Image won't upload

**Solutions:**
1. Check internet connection
2. Verify MinIO proxy is running
3. Try smaller image
4. Check permissions

### **Analysis Takes Too Long**
**Problem:** Waiting over 30 seconds

**Solutions:**
1. Check network speed
2. Try again during off-peak
3. Use smaller/compressed image
4. Restart app

### **Inaccurate Results**
**Problem:** Wrong food identification

**Solutions:**
1. Take clearer photo
2. Show full dish
3. Use better lighting
4. Ask specific question

### **No Recommendation**
**Problem:** Missing yes/no recommendation

**Solutions:**
1. Results still contain valuable info
2. Read full analysis
3. Consult healthcare provider

## 🎉 Benefits

### **For Patients:**
- 💪 Better nutrition during treatment
- 🎯 Informed meal choices
- 🍴 Confidence in food selection
- 📊 Understanding nutritional needs
- 💡 Educational tool

### **For Caregivers:**
- 👨‍🍳 Plan appropriate meals
- ✅ Verify meal suitability
- 📋 Track nutritional intake
- 💝 Support loved ones better

### **For Healthcare Teams:**
- 📈 Patient nutrition awareness
- 🤝 Support dietary counseling
- 📊 Educational tool
- 💬 Better patient conversations

## 🚀 Quick Start Checklist

Before using Food Scanner:

- [ ] MinIO server running (port 9000)
- [ ] Proxy server running (port 3001)
- [ ] App loaded and logged in
- [ ] Camera/gallery permissions granted
- [ ] Internet connection active

## 📞 Quick Reference

### **Access:**
Main Screen → 🍽️ Food Scanner button

### **Workflow:**
1. Upload Photo (📷)
2. Tap Analyze (🔍)
3. View Results (📊)
4. Scan Another (🔄)

### **Results Include:**
- Food name
- Calories, Protein, Carbs, Fat
- Recommendation (✅/⚠️)
- Detailed analysis
- Patient-specific tips

---

## ✅ Summary

The **Food Scanner** is a powerful AI tool that helps cancer patients and caregivers make informed dietary choices by:

1. **Identifying foods** from photos
2. **Estimating nutrition** accurately
3. **Providing recommendations** for cancer patients
4. **Offering helpful tips** for treatment
5. **Supporting better health** outcomes

**Start scanning your meals today!** 🍽️✨

---

*Remember: This is an educational tool. Always consult your healthcare team for personalized medical and nutritional advice.*
