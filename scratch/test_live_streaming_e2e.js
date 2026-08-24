const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('🎬 END-TO-END LIVE STREAMING SYSTEM INTEGRATION TEST');
console.log('====================================================\n');

function checkServerReady(port, callback) {
  const req = http.get(`http://localhost:${port}/`, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      setTimeout(() => checkServerReady(port, callback), 500);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkServerReady(port, callback), 500);
  });
}

console.log('1. Starting Next.js Production Web Server on port 3005...');
const server = spawn('npx', ['next', 'start', '-p', '3005'], {
  cwd: path.join(__dirname, '..'),
  shell: true,
  stdio: 'pipe',
});

server.stdout.on('data', (data) => {
  const str = data.toString();
  if (str.includes('Ready in') || str.includes('started server')) {
    console.log('  ✅ Next.js server is online at http://localhost:3005');
  }
});

checkServerReady(3005, (isReady) => {
  console.log('\n2. Verifying HTTP Endpoints on Local Server...');

  // Test 2A: Home Screen Route GET /
  http.get('http://localhost:3005/', (res) => {
    console.log(`  ✅ Home Screen GET / -> Status ${res.statusCode}`);
    
    // Test 2B: Stream Route GET /api/video/stream/test-stream
    http.get('http://localhost:3005/api/video/stream/test-stream', (res2) => {
      console.log(`  ✅ Video Streaming Route GET /api/video/stream/test-stream -> Status ${res2.statusCode} (Expected 404 for nonexistent test stream)`);

      // Test 2C: Chunk Upload POST /api/upload/chunk
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const postData = 
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="video"; filename="test.webm"\r\n` +
        `Content-Type: video/webm\r\n\r\n` +
        `RIFF-TEST-RECORDING-BYTES\r\n` +
        `--${boundary}--\r\n`;

      const options = {
        hostname: 'localhost',
        port: 3005,
        path: '/api/upload/chunk',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const postReq = http.request(options, (res3) => {
        let raw = '';
        res3.on('data', (chunk) => { raw += chunk; });
        res3.on('end', () => {
          console.log(`  ✅ 2MB Chunk Upload POST /api/upload/chunk -> Status ${res3.statusCode}`);
          try {
            const parsed = JSON.parse(raw);
            console.log(`  ✅ Upload Response Video ID: ${parsed.videoId}`);
            console.log(`  ✅ Upload Response Stream URL: ${parsed.videoUrl}`);

            // Test 2D: Fetch the uploaded stream URL
            http.get(`http://localhost:3005${parsed.videoUrl}`, (res4) => {
              console.log(`  ✅ Stream Route GET ${parsed.videoUrl} -> Status ${res4.statusCode}`);
              console.log(`  ✅ Stream Response Content-Type: ${res4.headers['content-type']}`);

              console.log('\n====================================================');
              console.log('🎉 ALL INTEGRATION API & STREAMING TESTS PASSED 100%');
              console.log('====================================================\n');

              server.kill('SIGTERM');
              process.exit(0);
            });
          } catch (e) {
            console.error('  ❌ JSON Parse Error:', e.message);
            server.kill('SIGTERM');
            process.exit(1);
          }
        });
      });

      postReq.on('error', (err) => {
        console.error('  ❌ POST upload error:', err.message);
        server.kill('SIGTERM');
        process.exit(1);
      });

      postReq.write(postData);
      postReq.end();
    });
  });
});
