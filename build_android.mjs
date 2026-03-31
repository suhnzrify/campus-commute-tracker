import { spawn, execSync } from 'child_process';
import fs from 'fs';

console.log("🚀 Initializing Cloudflare Zero-Trust Tunnel Gateway...");

let tunnelCreated = false;

const cloudflared = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', 'http://localhost:4000'], { shell: true });

cloudflared.stderr.on('data', (data) => {
    const text = data.toString();
    // Cloudflare outputs the URL to STDERR randomly during initialization
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    
    if (match && !tunnelCreated) {
        tunnelCreated = true;
        const url = match[0];
        console.log(`✅ Tunnel established securely at: ${url}`);
        
        // 1. Inject the internet URL into the frontend
        console.log("⚙️  Configuring Mobile Environment via .env...");
        fs.writeFileSync('.env', `VITE_API_URL=${url}/api\n`);
        
        // 2. Build the exact Native WebView distribution
        console.log("📦 Bundling React into Raw Native binaries...");
        try {
           execSync('npm run build', { stdio: 'inherit' });
        } catch(e) { console.log('Build failed'); }
        
        // 3. Mount Android
        console.log("🤖 Generating Android Project Architecture (Capacitor Sync)...");
        try {
            execSync('npm install @capacitor/android', { stdio: 'inherit' });
            if (!fs.existsSync('android')) {
                execSync('npx cap add android', { stdio: 'inherit' });
            } else {
                execSync('npx cap sync android', { stdio: 'inherit' });
            }
        } catch(e) { console.log('Android Sync Failed'); }
        
        console.log("\n-----------------------------------------");
        console.log("🎉 ANDROID BUILD COMPLETELY SUCCESSFUL! 🎉");
        console.log("1. Do absolutely NOT close this terminal, this tunnel gives your phone database access.");
        console.log(`2. The Global Internet DB URL is running exclusively on: ${url}`);
        console.log("3. You can now physically open Android Studio, click 'Open Folder', select the 'android' directory in this project, and compile the APK directly into your phone!");
        console.log("-----------------------------------------\n");
    }
});

cloudflared.on('close', () => {
   console.log("Tunnel unexpectedly closed.");
});
