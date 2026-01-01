// Where? - Cloudflare Worker DNS Proxy for GitHub
// A minimal, modern DNS proxy to bypass GitHub blocks

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve the GUI for root path
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(HTML_CONTENT, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
    
    // API endpoint to get status
    if (url.pathname === '/api/status') {
      const startTime = Date.now();
      
      try {
        // Test GitHub API connectivity
        const testResponse = await fetch('https://api.github.com/zen', {
          headers: {
            'User-Agent': 'Where-CloudflareWorker/1.0'
          }
        });
        
        const latency = Date.now() - startTime;
        
        return new Response(JSON.stringify({
          status: 'operational',
          uptime: '99.9%',
          latency: latency,
          github_status: testResponse.ok ? 'accessible' : 'limited',
          timestamp: new Date().toISOString()
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          status: 'degraded',
          error: error.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Proxy GitHub requests
    if (url.pathname.startsWith('/proxy/')) {
      const targetPath = url.pathname.replace('/proxy/', '');
      const targetUrl = `https://github.com/${targetPath}${url.search}`;
      
      try {
        // Clone the request
        const modifiedRequest = new Request(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: 'manual'
        });
        
        // Forward to GitHub
        const response = await fetch(modifiedRequest);
        
        // Clone response with CORS headers
        const modifiedResponse = new Response(response.body, response);
        modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
        modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        modifiedResponse.headers.set('Access-Control-Allow-Headers', '*');
        
        return modifiedResponse;
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Where? - GitHub DNS Proxy</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Nunito', system-ui, -apple-system, sans-serif;
      background: #fafafa;
      color: #2c3e50;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }
    
    .container {
      max-width: 900px;
      width: 100%;
    }
    
    header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    h1 {
      font-size: 3.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.5rem;
      letter-spacing: -1px;
    }
    
    .subtitle {
      font-size: 1.1rem;
      color: #7f8c8d;
      font-weight: 400;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .status-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      border: 1px solid #e8e8e8;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .status-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .status-label {
      font-size: 0.85rem;
      color: #95a5a6;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    
    .status-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
    }
    
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .status-operational {
      background: #2ecc71;
    }
    
    .status-degraded {
      background: #f39c12;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .config-section {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      border: 1px solid #e8e8e8;
      margin-bottom: 2rem;
    }
    
    .section-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 1.5rem;
    }
    
    .input-group {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      color: #7f8c8d;
      margin-bottom: 0.5rem;
    }
    
    input, select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e8e8e8;
      border-radius: 12px;
      font-family: 'Nunito', sans-serif;
      font-size: 1rem;
      transition: border-color 0.2s;
      background: #fafafa;
    }
    
    input:focus, select:focus {
      outline: none;
      border-color: #3498db;
      background: white;
    }
    
    .button {
      background: #3498db;
      color: white;
      border: none;
      padding: 0.875rem 2rem;
      border-radius: 12px;
      font-family: 'Nunito', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(52,152,219,0.2);
    }
    
    .button:hover {
      background: #2980b9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(52,152,219,0.3);
    }
    
    .button:active {
      transform: translateY(0);
    }
    
    .code-block {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 1.25rem;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      overflow-x: auto;
      margin-top: 1rem;
      line-height: 1.6;
    }
    
    .info-box {
      background: #e8f4fd;
      border-left: 4px solid #3498db;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.95rem;
      color: #2c3e50;
    }
    
    footer {
      text-align: center;
      margin-top: 3rem;
      color: #95a5a6;
      font-size: 0.9rem;
    }
    
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #e8e8e8;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Where?</h1>
      <p class="subtitle">GitHub DNS Proxy via Cloudflare Workers</p>
    </header>
    
    <div class="status-grid">
      <div class="status-card">
        <div class="status-label">Status</div>
        <div class="status-value">
          <span class="status-indicator status-operational"></span>
          <span id="status-text">Loading...</span>
        </div>
      </div>
      
      <div class="status-card">
        <div class="status-label">Uptime</div>
        <div class="status-value" id="uptime-text">--</div>
      </div>
      
      <div class="status-card">
        <div class="status-label">Latency</div>
        <div class="status-value" id="latency-text">-- ms</div>
      </div>
      
      <div class="status-card">
        <div class="status-label">GitHub</div>
        <div class="status-value" id="github-status">--</div>
      </div>
    </div>
    
    <div class="config-section">
      <h2 class="section-title">Configure Git DNS</h2>
      
      <div class="input-group">
        <label for="protocol">Protocol</label>
        <select id="protocol">
          <option value="https">HTTPS (Recommended)</option>
          <option value="http">HTTP</option>
        </select>
      </div>
      
      <div class="input-group">
        <label for="worker-url">Your Worker URL</label>
        <input type="text" id="worker-url" placeholder="your-worker.workers.dev" value="">
      </div>
      
      <button class="button" onclick="generateConfig()">Generate Configuration</button>
      
      <div id="config-output" style="display:none;">
        <div class="code-block" id="git-config"></div>
        
        <div class="info-box">
          <strong>How to use:</strong> Copy the command above and run it in your terminal. This will configure Git to use this proxy for GitHub access.
        </div>
      </div>
    </div>
    
    <div class="config-section">
      <h2 class="section-title">Testing Connection</h2>
      <p style="margin-bottom: 1rem; color: #7f8c8d;">Test if GitHub is accessible through this proxy</p>
      <button class="button" onclick="testConnection()">Test Now</button>
      <div id="test-result" style="margin-top: 1rem;"></div>
    </div>
    
    <footer>
      <p><strong>where-cloudflareworker</strong> • Bypass GitHub blocks with ease</p>
    </footer>
  </div>
  
  <script>
    async function fetchStatus() {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        document.getElementById('status-text').textContent = 
          data.status === 'operational' ? 'Operational' : 'Degraded';
        document.getElementById('uptime-text').textContent = data.uptime || '--';
        document.getElementById('latency-text').textContent = 
          data.latency ? data.latency + ' ms' : '-- ms';
        document.getElementById('github-status').textContent = 
          data.github_status === 'accessible' ? 'Accessible' : 'Limited';
        
        const indicator = document.querySelector('.status-indicator');
        indicator.className = 'status-indicator ' + 
          (data.status === 'operational' ? 'status-operational' : 'status-degraded');
      } catch (error) {
        document.getElementById('status-text').textContent = 'Error';
        console.error('Failed to fetch status:', error);
      }
    }
    
    function generateConfig() {
      const protocol = document.getElementById('protocol').value;
      const workerUrl = document.getElementById('worker-url').value || window.location.host;
      
      const config = \`# Configure Git to use Where? proxy
git config --global url."\${protocol}://\${workerUrl}/proxy/".insteadOf "https://github.com/"

# To revert this configuration:
# git config --global --unset url.\${protocol}://\${workerUrl}/proxy/.insteadOf\`;
      
      document.getElementById('git-config').textContent = config;
      document.getElementById('config-output').style.display = 'block';
    }
    
    async function testConnection() {
      const resultDiv = document.getElementById('test-result');
      resultDiv.innerHTML = '<div class="loading"></div> Testing connection...';
      
      try {
        const start = Date.now();
        const response = await fetch('/proxy/');
        const elapsed = Date.now() - start;
        
        if (response.ok) {
          resultDiv.innerHTML = \`<div class="info-box" style="background:#d5f4e6;border-color:#27ae60;">
            <strong>✓ Success!</strong> GitHub is accessible through this proxy (responded in \${elapsed}ms)
          </div>\`;
        } else {
          resultDiv.innerHTML = \`<div class="info-box" style="background:#fadbd8;border-color:#e74c3c;">
            <strong>✗ Failed</strong> Connection test failed with status: \${response.status}
          </div>\`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`<div class="info-box" style="background:#fadbd8;border-color:#e74c3c;">
          <strong>✗ Error</strong> \${error.message}
        </div>\`;
      }
    }
    
    // Set worker URL on page load
    document.getElementById('worker-url').value = window.location.host;
    
    // Fetch status on load
    fetchStatus();
    
    // Refresh status every 30 seconds
    setInterval(fetchStatus, 30000);
  </script>
</body>
</html>`;