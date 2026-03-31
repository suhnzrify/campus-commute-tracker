# Campus Commute Tracker - OTP Debug Plan

**Status:** Implementing Debug Logs

## Current Issue
- Frontend (8083) → Backend (4000) OTP requests silent
- No terminal logs/emails

## 1. 🔧 Add Debug Logs to server/index.js (In Progress)
```
[x] console.log('🔥 OTP REQUEST RECEIVED:', req.body)
[x] console.log('🚀 YOUR DEV OTP IS:', otp, 'for', emailStr) 
```

## 2. ✅ Test Connectivity
```
Frontend Network tab → POST /api/auth/request-otp
Backend terminal → Expected 🔥/🚀 logs
```

## 3. ⏳ Next After Debug
- Fix VITE_API_URL if wrong
- Configure SMTP for production
- Mobile Capacitor build
```

</xai:function_call]



<xai:function_call name="edit_file">
<parameter name="path">server/index.js
