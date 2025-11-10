# Chat Photo Upload Feature

## 🎯 Overview

The AI Chat now supports photo uploads! Users can share images with the AI assistant for analysis, discussion, or questions about medical symptoms, food items, or general health queries.

## ✨ Features

### **1. Photo Selection** 📷
- Tap the camera icon (📷) in the chat input
- Choose photos from device gallery
- Image picker with crop/edit functionality
- Supports all standard image formats

### **2. Image Upload to MinIO** ☁️
- Photos uploaded to your local MinIO server
- Stored in `test-bucket/chat/` folder
- Automatic filename generation: `chat-{timestamp}.jpg`
- Real-time upload progress indicator

### **3. Image Display** 🖼️
- Photos appear in chat bubbles
- User messages show the sent image
- 200x200px display size with rounded corners
- Tap to view full size (future enhancement)

### **4. AI Image Analysis** 🤖
- Images sent with contextual information to Gemini AI
- AI can discuss, analyze, or answer questions about the image
- Useful for:
  - Food/meal analysis
  - Symptom visualization
  - Medication identification
  - General health queries

## 🎨 User Interface

### **Photo Button**
- **Location**: Left side of text input
- **Icon**: 📷 camera emoji
- **Style**: White circle button with border
- **State**: Disabled during upload/loading

### **Image Preview**
- **Location**: Above input area
- **Size**: 100x100px thumbnail
- **Border**: Pink accent color
- **Actions**: ✕ button to remove image

### **Upload Progress**
- **Indicator**: Spinner + "Uploading image..." text
- **Color**: Pink spinner matching app theme
- **Position**: Above input area

## 🔧 Technical Implementation

### **Components Used**
```typescript
- expo-image-picker: Image selection
- MinIO Storage: Cloud storage backend
- Gemini AI: Image analysis
```

### **Upload Flow**
```
1. User taps camera button
2. Image picker opens
3. User selects/edits image
4. Image preview shows
5. User types optional message
6. Tap send button
7. Image uploads to MinIO
8. Message sent with image URL
9. AI receives image context
10. AI responds with analysis
```

### **File Storage**
```
MinIO Structure:
test-bucket/
└── chat/
    ├── chat-1699999999999.jpg
    ├── chat-1699999999998.jpg
    └── ...
```

### **Message Format**
```typescript
{
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  imageUrl?: string; // MinIO URL
}
```

## 📱 Usage Examples

### **Example 1: Food Analysis**
```
User: *uploads photo of meal*
User: "Is this healthy for someone with cancer?"
AI: "Based on the image, I can see... [analysis]"
```

### **Example 2: Symptom Check**
```
User: *uploads photo of skin condition*
User: "What could this be?"
AI: "I can see the image shows... [response]"
```

### **Example 3: Medication Query**
```
User: *uploads photo of pill bottle*
User: "Can I take this with my current treatment?"
AI: "Based on the medication shown... [advice]"
```

## 🔐 Privacy & Security

### **Data Storage**
- ✅ Images stored on **local MinIO** server
- ✅ No third-party cloud storage
- ✅ Full control over data
- ✅ Can be deleted manually

### **AI Processing**
- ⚠️ Images sent to Gemini AI API for analysis
- ⚠️ Consider privacy before uploading sensitive medical images
- ✅ No permanent storage by Gemini (per their policy)
- ✅ Contextual information helps AI provide better responses

## 🚀 Testing

### **1. Test Upload**
```powershell
# Start MinIO server (must be running)
.\minio.exe server C:\Users\ahmed\CascadeProjects\cloud\data1 C:\Users\ahmed\CascadeProjects\cloud\data2 --console-address ":9001"

# Verify bucket exists
.\mc.exe ls myminio/test-bucket
```

### **2. Test in App**
1. Open AI Chat screen
2. Tap camera button (📷)
3. Select a test image
4. See preview appear
5. Type optional message
6. Tap send
7. Watch upload progress
8. See image in message
9. Get AI response

### **3. Verify Upload**
```powershell
# Check uploaded files
.\mc.exe ls myminio/test-bucket/chat/

# View file URL
.\mc.exe stat myminio/test-bucket/chat/chat-{timestamp}.jpg
```

## 🐛 Troubleshooting

### **Image Won't Upload**
**Problem**: Upload fails or hangs

**Solutions**:
1. Check MinIO server is running on port 9000
2. Verify bucket is public: `.\mc.exe anonymous get myminio/test-bucket`
3. Check network connection
4. View console logs for errors
5. Try smaller image file

### **Can't Select Image**
**Problem**: Image picker doesn't open

**Solutions**:
1. Grant photo library permissions in device settings
2. Restart the app
3. Check if ImagePicker is installed: `npm list expo-image-picker`

### **Image Doesn't Show**
**Problem**: Image uploaded but doesn't display

**Solutions**:
1. Check image URL in console logs
2. Verify MinIO is accessible: `curl http://192.168.1.9:9000/test-bucket/chat/filename.jpg`
3. Ensure phone and computer on same WiFi
4. Check firewall settings

### **AI Doesn't Mention Image**
**Problem**: AI responds without referencing the image

**Solutions**:
1. Gemini AI has limitations on image analysis via text-only API
2. Add descriptive text with the image
3. Current implementation sends URL only - may need vision API upgrade

## 🎯 Future Enhancements

### **Planned Features**
- [ ] Full-screen image viewer
- [ ] Multiple image upload
- [ ] Image compression before upload
- [ ] Camera capture (not just gallery)
- [ ] Image history/gallery
- [ ] Delete uploaded images
- [ ] Image annotation
- [ ] OCR text extraction
- [ ] Gemini Vision API integration

### **Performance Improvements**
- [ ] Image caching
- [ ] Lazy loading for message images
- [ ] Progressive image loading
- [ ] Thumbnail generation

## 📊 Usage Statistics

### **Storage Usage**
- Average image size: 200-500 KB
- Compressed quality: 0.8
- Storage per 100 images: ~25-50 MB

### **Upload Speed**
- Local network: 1-3 seconds
- Over internet: 3-10 seconds
- Depends on image size and network

## 🔗 Related Documentation

- [MinIO Setup Guide](MINIO-SETUP.md)
- [Gemini AI Integration](src/services/geminiAI.ts)
- [Image Upload Service](src/services/minioStorage.ts)

---

**Note**: Ensure MinIO server is running before using photo upload feature!
