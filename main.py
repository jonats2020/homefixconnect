import os
import subprocess
import time
import threading
import requests
import logging
from flask import Flask, request, Response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variable to track Node.js server process
node_process = None
node_started = False
node_port = 8000

def start_node_server():
    """Start the Node.js Express API server as a background process."""
    global node_process, node_started
    
    if node_process is None or node_process.poll() is not None:
        logger.info("Starting Node.js server...")
        
        # Define the environment variables needed by the Node.js server
        env = os.environ.copy()
        env["PORT"] = str(node_port)
        
        # Start the Node.js server process
        node_process = subprocess.Popen(
            ["node", "src/server.js"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            universal_newlines=True
        )
        
        # Wait for the server to start up
        logger.info("Waiting for Node.js server to start...")
        for _ in range(30):  # Try for 30 seconds
            try:
                response = requests.get(f"http://localhost:{node_port}/api/health")
                if response.status_code == 200:
                    logger.info("Node.js server is ready!")
                    node_started = True
                    break
            except requests.ConnectionError:
                pass
            time.sleep(1)
        
        # Start thread to read output logs from Node.js process
        threading.Thread(target=read_process_output, daemon=True).start()
        
        if not node_started:
            logger.error("Failed to start Node.js server within timeout period.")
    
    return node_started

def read_process_output():
    """Read and log output from the Node.js process."""
    global node_process
    
    for line in iter(node_process.stdout.readline, ''):
        logger.info(f"Node.js: {line.strip()}")
    
    for line in iter(node_process.stderr.readline, ''):
        logger.error(f"Node.js Error: {line.strip()}")

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
def proxy(path):
    """Proxy all requests to the Node.js server."""
    
    # Start Node.js server if not already running
    if not start_node_server():
        return Response(
            "Node.js API server is not available. Please check server logs.",
            status=503
        )
    
    # Build the URL for the Node.js server
    target_url = f"http://localhost:{node_port}/{path}"
    
    # Forward the request to the Node.js server
    try:
        # Prepare headers to forward
        headers = {
            key: value for key, value in request.headers
            if key.lower() not in ['host', 'connection', 'content-length']
        }
        
        # Forward the request to the Node.js server
        response = requests.request(
            method=request.method,
            url=target_url,
            headers=headers,
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
            stream=True
        )
        
        # Prepare the response to send back to the client
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [
            (name, value) for name, value in response.raw.headers.items()
            if name.lower() not in excluded_headers
        ]
        
        # Return the proxied response
        return Response(
            response.content,
            response.status_code,
            headers
        )
    
    except requests.RequestException as e:
        logger.error(f"Error forwarding request: {e}")
        return Response(
            f"Error connecting to Node.js API server: {e}",
            status=500
        )

# Initialize server when app starts with Gunicorn
# Note: before_first_request is deprecated, use Flask 2.x with_app_context instead
@app.before_request
def check_node_server():
    if not node_started:
        start_node_server()

# Stand-alone server for development (not used with Gunicorn)
if __name__ == '__main__':
    start_node_server()
    app.run(host='0.0.0.0', port=5000)