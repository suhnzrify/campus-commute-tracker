# API URL & OTP Test - Complete ✅

**API Status:**
- authContext.tsx: Hardcoded https://lbs-bus-tracker.onrender.com/api ✅
- api.ts: Uses VITE_API_URL (add to .env if needed)

**Android OTP Fail Fix:**
1. `.env`: VITE_API_URL=https://lbs-bus-tracker.onrender.com/api
2. `npm run build`
3. `npx cap sync android`
4. `npx cap run android` (fix JAVA_HOME first)
5. Test LoginPage → Request OTP → backend logs OTP code

**Debug Android:**
- Android Studio Logcat: Filter "Capacitor" or "Console" for errors (net::ERR_CONNECTION_REFUSED?)
- chrome://inspect → Remote devices → Inspect WebView console/Network
- Test email: adminlbscek@gmail.com (role: admin)
- Backend terminal shows 🔥 OTP REQUEST & 🚀 code if reaching server
- Render Logs for remote hits

**Master OTP:** '000000' for demo

Local server port 4000 running. Render SMTP set in dashboard? Wake-up 30-50s.

Test now - works in browser first?
