export const config = {

  runtime: 'edge', // 使用 Edge 节点，速度极快

};



export default async function handler(request) {

  const url = new URL(request.url);

  const targetUrl = url.searchParams.get('url');



  if (!targetUrl) {

    return new Response('Missing target URL', { status: 400 });

  }



  try {

    // 直接请求目标机场链接，保留原始请求头（如 User-Agent）

    const response = await fetch(targetUrl, {

      headers: request.headers,

      redirect: 'follow',

    });



    // 透明返回所有内容和头信息

    return new Response(response.body, {

      status: response.status,

      headers: response.headers,

    });

  } catch (error) {

    return new Response('Vercel Proxy Error: ' + error.message, { status: 502 });

  }

}
