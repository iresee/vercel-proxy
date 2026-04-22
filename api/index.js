export const config = {
  runtime: 'edge', 
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export default async function handler(request) {
  // 1. 处理 CORS 预检请求 (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. 解析目标 URL
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing target URL parameter', { status: 400, headers: corsHeaders });
  }

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return new Response('Invalid URL scheme', { status: 400, headers: corsHeaders });
  }

  try {
    // 3. 构建代理请求头
    const fetchHeaders = new Headers();
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      fetchHeaders.set('User-Agent', userAgent);
    }

    const fetchOptions = {
      method: request.method,
      headers: fetchHeaders,
      redirect: 'follow',
    };

    // 如果不是 GET/HEAD 请求，带上请求体
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = request.body;
      fetchOptions.duplex = 'half'; 
    }

    // 4. 发起实际请求
    const response = await fetch(targetUrl, fetchOptions);

    // 5. 处理响应头
    const responseHeaders = new Headers(response.headers);
    
    // 注入允许跨域的 Header
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }
    
    // 删除 content-encoding，由 Vercel 自动处理压缩，防止乱码
    responseHeaders.delete('content-encoding'); 
    
    // 强制声明附件类型，防止部分目标服务器不返回 content-type
    if (!responseHeaders.has('content-type')) {
        responseHeaders.set('content-type', 'text/plain; charset=utf-8');
    }

    // 6. 返回代理结果
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Vercel Proxy Error', details: error.message }), { 
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
