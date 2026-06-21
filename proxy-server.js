const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Proxy endpoints
app.get('/proxy/fetch/:encodedUrl', async (req, res) => {
    try {
        const url = Buffer.from(req.params.encodedUrl, 'base64').toString();
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const contentType = response.headers.get('content-type') || 'text/html';
        const content = await response.text();
        
        // Fix relative URLs
        const modifiedContent = this.fixRelativeUrls(content, url);
        
        res.set('Content-Type', contentType);
        res.send(modifiedContent);
    } catch (error) {
        console.error('Fetch proxy error:', error);
        res.status(500).send('Proxy error');
    }
});

app.get('/proxy/uv/:encodedUrl', async (req, res) => {
    try {
        const url = Buffer.from(req.params.encodedUrl, 'base64').toString();
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate'
            }
        });
        
        const contentType = response.headers.get('content-type') || 'text/html';
        let content = await response.text();
        
        // Ultraviolet-style URL rewriting
        content = this.rewriteUrls(content, url);
        
        res.set('Content-Type', contentType);
        res.send(content);
    } catch (error) {
        console.error('UV proxy error:', error);
        res.status(500).send('UV proxy error');
    }
});

// Helper methods
function fixRelativeUrls(html, baseUrl) {
    const base = new URL(baseUrl);
    
    // Fix relative URLs in href/src attributes
    return html.replace(
        /(href|src)=["']([^"']*)["']/gi,
        (match, attr, value) => {
            try {
                const url = new URL(value, base.href);
                if (url.origin === base.origin) {
                    // Keep same-origin URLs as-is
                    return `${attr}="${value}"`;
                } else {
                    // Proxy external URLs
                    const encoded = Buffer.from(url.href).toString('base64');
                    return `${attr}="/proxy/uv/${encoded}"`;
                }
            } catch {
                return match;
            }
        }
    );
}

function rewriteUrls(html, baseUrl) {
    const base = new URL(baseUrl);
    
    // Rewrite various types of URLs
    return html
        .replace(
            /(href|src|action)=["']([^"']*)["']/gi,
            (match, attr, value) => {
                if (value.startsWith('data:') || value.startsWith('#') || value.startsWith('javascript:')) {
                    return match;
                }
                
                try {
                    const url = new URL(value, base.href);
                    const encoded = Buffer.from(url.href).toString('base64');
                    return `${attr}="/proxy/uv/${encoded}"`;
                } catch {
                    return match;
                }
            }
        )
        .replace(
            /url\(['"]?([^)'"]+)['"]?\)/gi,
            (match, value) => {
                if (value.startsWith('data:') || value.startsWith('#') || value.startsWith('javascript:')) {
                    return match;
                }
                
                try {
                    const url = new URL(value, base.href);
                    const encoded = Buffer.from(url.href).toString('base64');
                    return `url("/proxy/uv/${encoded}")`;
                } catch {
                    return match;
                }
            }
        );
}

// Start server
app.listen(PORT, () => {
    console.log(`Red Proxy server running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/index.html in your browser`);
});
