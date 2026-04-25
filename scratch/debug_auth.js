async function debugSession() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers.get('content-type'));
    const text = await res.text();
    console.log('Body snippet:', text.substring(0, 200));
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

debugSession();
