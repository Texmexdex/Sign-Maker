/**
 * Simple HTTP server for the 3D Sign Creator application
 * 
 * This is a convenience script to run a local server.
 * To use, run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8001;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((request, response) => {
    let filePath = '.' + request.url;
    
    // Default to index.html if the path is '/'
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Get the file extension
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(404, { 'Content-Type': 'text/html' });
                    response.end(content || '404: File Not Found', 'utf-8');
                });
            } else {
                // Server error
                response.writeHead(500);
                response.end('Sorry, there was an error: ' + error.code);
            }
        } else {
            // Success
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Press Ctrl+C to stop the server`);
});