# 🔍 Firebase Permissions Troubleshooting

## Issue: Can't Post Answers

If users can't post answers after completing onboarding, it's likely a **Firebase Firestore permissions** issue.

---

## ✅ Quick Check

### 1. Check Console Logs

After trying to post an answer, check the console for error messages like:
- `"Missing or insufficient permissions"`
- `"PERMISSION_DENIED"`
- `"Error submitting answer:"`

---

## 🔧 Fix Firebase Permissions

### Step 1: Go to Firebase Console

1. Open https://console.firebase.google.com
2. Select your project
3. Click "Firestore Database" in the left menu
4. Click the "Rules" tab

### Step 2: Update Firestore Rules

Replace your current rules with these (for development/testing):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - authenticated users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Questions collection - authenticated users can read all, write their own
    match /questions/{questionId} {
      allow read: if true;  // Anyone can read questions
      allow create: if request.auth != null;  // Must be logged in to create
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.author.id;
    }
    
    // Answers collection - authenticated users can read all, write their own
    match /answers/{answerId} {
      allow read: if true;  // Anyone can read answers
      allow create: if request.auth != null;  // Must be logged in to create
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.author.id;
    }
    
    // Votes collection
    match /votes/{voteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Step 3: Publish Rules

1. Click "Publish" button in Firebase Console
2. Wait for confirmation message
3. Try posting an answer again

---

## 🧪 Test the Fix

1. **Reload your app**
2. **Try posting a question**
   - Should work now
3. **Try posting an answer**
   - Should work now
4. **Check console logs**
   - Should see: "Answer submitted successfully"

---

## 🔐 Production Rules (After Testing)

Once everything works, tighten security for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasCompletedOnboarding() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.onboardingComplete == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isOwner(userId);
    }
    
    // Questions - must have completed onboarding to post
    match /questions/{questionId} {
      allow read: if true;
      allow create: if hasCompletedOnboarding();
      allow update: if isSignedIn() && resource.data.author.id == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.author.id == request.auth.uid;
    }
    
    // Answers - must have completed onboarding to post
    match /answers/{answerId} {
      allow read: if true;
      allow create: if hasCompletedOnboarding();
      allow update: if isSignedIn() && resource.data.author.id == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.author.id == request.auth.uid;
    }
    
    // Votes
    match /votes/{voteId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 📋 Common Permission Errors

### Error: "Missing or insufficient permissions"
**Cause:** Firestore rules blocking the write  
**Fix:** Update rules as shown above

### Error: "PERMISSION_DENIED: Permission denied"
**Cause:** Rules require authentication but user not properly logged in  
**Fix:** 
1. Check if user is logged in (`console.log(auth.currentUser)`)
2. Sign out and sign in again
3. Complete onboarding if required

### Error: "auth/network-request-failed"
**Cause:** Network connectivity issue  
**Fix:** 
1. Check internet connection
2. Check if Firebase services are online
3. Verify Firebase config in code

---

## 🔍 Debug Checklist

- [ ] User is logged in
- [ ] User completed onboarding
- [ ] Firebase console Rules updated
- [ ] Rules published successfully
- [ ] App reloaded after rules change
- [ ] Console shows "Submitting answer" log
- [ ] No permission errors in console
- [ ] "Answer submitted successfully" appears
- [ ] Answer appears in Firestore database
- [ ] Answer appears in app UI

---

## 💡 Quick Test

Run this in your browser console on Firebase:

1. Go to Firestore Database → Data tab
2. Try to manually add a document to "answers" collection
3. If it fails → Rules are blocking writes
4. If it works → Issue is elsewhere (likely authentication)

---

## 🚨 Emergency Fix (Testing Only)

If you need to test immediately and nothing else works:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // DANGER: Open to everyone!
    }
  }
}
```

⚠️ **WARNING:** This allows ANYONE to read/write ALL data!  
Only use for testing, never in production!

---

**Status**: Awaiting Firebase Rules Update  
**Next Step**: Update Firestore Rules in Firebase Console
