import { db } from './firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Expected payload from EMQX Rule Engine Webhook
    // { "topic": "minar/bug/sensor/", "payload": { ... }, "timestamp": 1234567890 }
    
    const data = req.body;
    
    // Ensure we have topic and payload
    if (!data || !data.topic || !data.payload) {
      return res.status(400).json({ error: 'Missing topic or payload' });
    }

    // Sometimes payload is a stringified JSON depending on EMQX config
    let payloadObj = data.payload;
    if (typeof payloadObj === 'string') {
      try {
        payloadObj = JSON.parse(payloadObj);
      } catch (e) {
        // If it's not JSON, we can still store it as string
      }
    }

    // Determine a timestamp
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    // Write to Firestore 'device_history' collection
    await db.collection('device_history').add({
      topic: data.topic,
      data: payloadObj,
      timestamp: timestamp,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving historical data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
