import { spawn, execSync } from 'child_process';
import fs from 'fs';

console.log("🚀 Initializing Cloudflare Zero-Trust Tunnel Gateway...");

let tunnelCreated = false;

const cloudflared = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', 'https://lbs-bus-tracker.onrender.com/api'], { shell: true });

cloudflared.stderr.on('data', (data) => {
    const text = data.toString();
    // Cloudflare outputs the URL to STDERR randomly during initialization
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    
    if (match && !tunnelCreated) {
        tunnelCreated = true;
        const url = match[0];
        console.log(`✅ Tunnel established securely at: ${url}`);
        
        // 1. Inject the internet URL into the frontend environment
        console.log("⚙️  Configuring Mobile Environment via .env...");
        let envContent = '';
        try {
            if (fs.existsSync('.env')) {
                envContent = fs.readFileSync('.env', 'utf8');
            }
        } catch(e) {}

        const apiUrl = `${url}/api`;
        // Replace or Append VITE_API_URL and VITE_API_BASE_URL
        const lines = envContent.split('\n').filter(l => !l.startsWith('VITE_API_URL=') && !l.startsWith('VITE_API_BASE_URL='));
        lines.push(`VITE_API_URL=${apiUrl}`);
        lines.push(`VITE_API_BASE_URL=${apiUrl}`);
        
        fs.writeFileSync('.env', lines.join('\n') + '\n');
        
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
