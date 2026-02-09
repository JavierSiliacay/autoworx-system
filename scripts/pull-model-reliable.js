const http = require('http');

const data = JSON.stringify({
    name: 'llama3.2:1b',
    stream: false
});

const options = {
    hostname: 'localhost',
    port: 11434,
    path: '/api/pull',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    },
    timeout: 600000 // 10 minutes
};

console.log("Requesting pull for llama3.2:1b...");

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
    res.on('end', () => {
        console.log('\nPull complete.');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
