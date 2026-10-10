// Test sending push notification via Expo Push API
const token = 'ExponentPushToken[6ap6jSKTNY_lQmtOcpBGzk]';

async function sendTest() {
  console.log('Sending test push notification to:', token);
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      title: 'EduHome Alert 🎓',
      body: 'Push notifications are working! Welcome to EduHome.',
      sound: 'default',
      channelId: 'default',
      priority: 'high',
    }),
  });

  const json = await res.json();
  console.log('Result:', JSON.stringify(json, null, 2));
}

sendTest().catch(console.error);
