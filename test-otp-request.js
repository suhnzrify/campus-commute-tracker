fetch('http://localhost:4000/api/auth/request-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'adminlbscek@gmail.com' })
})
.then(res => res.json())
.then(data => {
  console.log('OTP Request Result:', data);
  if (data.success) {
    console.log('✅ OTP email triggered successfully!');
  } else {
    console.error('❌ OTP request failed:', data.error);
  }
})
.catch(err => console.error('❌ Network error:', err.message));
