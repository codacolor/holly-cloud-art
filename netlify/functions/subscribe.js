exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { email, name } = JSON.parse(event.body);

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
  }

  const formId = process.env.KIT_FORM_ID;
  const apiKey = process.env.KIT_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': apiKey,
  };

  // Step 1: Create or update the subscriber
  const subscriberRes = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email_address: email,
      first_name: name || '',
    }),
  });

  if (!subscriberRes.ok) {
    const err = await subscriberRes.json();
    return {
      statusCode: subscriberRes.status,
      body: JSON.stringify({ error: err.errors || 'Failed to create subscriber' }),
    };
  }

  // Step 2: Add subscriber to the form
  const formRes = await fetch(`https://api.kit.com/v4/forms/${formId}/subscribers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email_address: email,
    }),
  });

  if (!formRes.ok) {
    const err = await formRes.json();
    return {
      statusCode: formRes.status,
      body: JSON.stringify({ error: err.errors || 'Failed to add to form' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
