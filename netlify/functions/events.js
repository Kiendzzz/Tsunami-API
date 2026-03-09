// Lưu trữ tạm thời trong memory (sẽ mất khi function ngủ, nhưng đủ dùng)
let events = {
  fullmoon: new Map(),
  mirage: new Map(),
  rip_indra: new Map(),
  darkbeard: new Map(),
  soul_reaper: new Map(),
  dough_king: new Map()
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // POST - nhận job ID từ bot
  if (event.httpMethod === 'POST') {
    try {
      const { type, job_id, token } = JSON.parse(event.body);
      const validTypes = Object.keys(events);
      
      // Kiểm tra token từ biến môi trường
      if (token !== process.env.API_TOKEN) {
        return { statusCode: 403, headers, body: 'Forbidden' };
      }
      if (!validTypes.includes(type) || !job_id) {
        return { statusCode: 400, headers, body: 'Invalid request' };
      }

      // Lưu job ID kèm timestamp
      events[type].set(job_id, Date.now());

      // Xóa job cũ hơn 10 phút
      const now = Date.now();
      for (const [id, ts] of events[type]) {
        if (now - ts > 10 * 60 * 1000) events[type].delete(id);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: e.message }) };
    }
  }

  // GET - trả về danh sách job ID theo loại
  if (event.httpMethod === 'GET') {
    const url = new URL(event.url, `http://${event.headers.host}`);
    const type = url.searchParams.get('type');
    
    if (!type || !events[type]) {
      return { statusCode: 400, headers, body: 'Missing or invalid type' };
    }

    const servers = Array.from(events[type].keys());
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(servers),
    };
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
