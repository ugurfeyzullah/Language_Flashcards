#!/usr/bin/env python3
"""
Enhanced HTTP server for the Language Flash Cards web application.
Includes user management API endpoints.
"""

import json
import os
import sys
import webbrowser
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import http.server
import socketserver
from user_manager import user_manager

# Configuration
PORT = 8000
DIRECTORY = Path(__file__).parent

class FlashCardHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        # Add CORS headers for API endpoints
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight requests for CORS."""
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for API endpoints."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request('POST', parsed_path)
        else:
            # Default behavior for non-API requests
            super().do_POST()
    
    def do_GET(self):
        """Handle GET requests, including API endpoints."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request('GET', parsed_path)
        else:
            # Default behavior for static files
            super().do_GET()
    
    def handle_api_request(self, method, parsed_path):
        """Handle API requests."""
        print(f"🔍 [SERVER DEBUG] API request: {method} {parsed_path.path}")
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            print(f"🔍 [SERVER DEBUG] Content length: {content_length}")
            
            request_data = {}
            
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                print(f"🔍 [SERVER DEBUG] Raw POST data: {post_data[:200]}...")  # First 200 chars
                try:
                    request_data = json.loads(post_data.decode('utf-8'))
                    print(f"🔍 [SERVER DEBUG] Parsed JSON keys: {list(request_data.keys())}")
                except json.JSONDecodeError as e:
                    print(f"❌ [SERVER DEBUG] JSON decode error: {e}")
                    self.send_error_response(400, "Invalid JSON")
                    return
            
            # Route API requests
            print(f"🔍 [SERVER DEBUG] Routing to appropriate handler...")
            if parsed_path.path == '/api/register' and method == 'POST':
                print(f"🔍 [SERVER DEBUG] -> handle_register")
                self.handle_register(request_data)
            elif parsed_path.path == '/api/login' and method == 'POST':
                print(f"🔍 [SERVER DEBUG] -> handle_login")
                self.handle_login(request_data)
            elif parsed_path.path == '/api/logout' and method == 'POST':
                print(f"🔍 [SERVER DEBUG] -> handle_logout")
                self.handle_logout(request_data)
            elif parsed_path.path == '/api/progress' and method == 'GET':
                print(f"🔍 [SERVER DEBUG] -> handle_get_progress")
                self.handle_get_progress(request_data)
            elif parsed_path.path == '/api/progress' and method == 'POST':
                print(f"🔍 [SERVER DEBUG] -> handle_save_progress")
                self.handle_save_progress(request_data)
            elif parsed_path.path == '/api/user/stats' and method == 'GET':
                print(f"🔍 [SERVER DEBUG] -> handle_get_stats")
                self.handle_get_stats(request_data)
            elif parsed_path.path == '/api/validate' and method == 'POST':
                print(f"🔍 [SERVER DEBUG] -> handle_validate_session")
                self.handle_validate_session(request_data)
            else:
                print(f"❌ [SERVER DEBUG] Unknown endpoint: {method} {parsed_path.path}")
                self.send_error_response(404, "API endpoint not found")
                
        except Exception as e:
            print(f"❌ API error: {e}")
            print(f"❌ [SERVER DEBUG] Exception type: {type(e).__name__}")
            print(f"❌ [SERVER DEBUG] Exception details: {str(e)}")
            import traceback
            print(f"❌ [SERVER DEBUG] Full traceback:")
            traceback.print_exc()
            self.send_error_response(500, f"Internal server error: {str(e)}")
    
    def send_json_response(self, data, status_code=200):
        """Send a JSON response."""
        response_data = json.dumps(data, ensure_ascii=False, indent=2)
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response_data.encode('utf-8'))))
        self.end_headers()
        self.wfile.write(response_data.encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        """Send an error response."""
        self.send_json_response({"error": message}, status_code)
    
    def get_auth_token(self, request_data):
        """Extract auth token from request."""
        # Try Authorization header first
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        
        # Try request data
        return request_data.get('token', '')
    
    def handle_register(self, request_data):
        """Handle user registration."""
        print(f"🔍 [API DEBUG] Registration request received")
        print(f"🔍 [API DEBUG] Request data keys: {list(request_data.keys())}")
        
        username = request_data.get('username', '').strip()
        password = request_data.get('password', '')
        email = request_data.get('email', '').strip()
        
        print(f"🔍 [API DEBUG] Username: '{username}' (length: {len(username)})")
        print(f"🔍 [API DEBUG] Password provided: {'Yes' if password else 'No'} (length: {len(password) if password else 0})")
        print(f"🔍 [API DEBUG] Email: '{email}'")
        
        if not username or not password:
            print(f"❌ [API DEBUG] Missing required fields")
            self.send_error_response(400, "Username and password are required")
            return
        
        print(f"🔍 [API DEBUG] Calling user_manager.register_user...")
        result = user_manager.register_user(username, password, email)
        print(f"🔍 [API DEBUG] Registration result: {result}")
        
        if result["success"]:
            print(f"✅ [API DEBUG] Registration successful, sending 201 response")
            self.send_json_response(result, 201)
        else:
            print(f"❌ [API DEBUG] Registration failed, sending 400 response: {result['error']}")
            self.send_error_response(400, result["error"])
    
    def handle_login(self, request_data):
        """Handle user login."""
        username = request_data.get('username', '').strip()
        password = request_data.get('password', '')
        
        if not username or not password:
            self.send_error_response(400, "Username and password are required")
            return
        
        result = user_manager.login_user(username, password)
        
        if result["success"]:
            self.send_json_response(result)
        else:
            self.send_error_response(401, result["error"])
    
    def handle_logout(self, request_data):
        """Handle user logout."""
        token = self.get_auth_token(request_data)
        
        if not token:
            self.send_error_response(400, "Token is required")
            return
        
        result = user_manager.logout_user(token)
        self.send_json_response(result)
    
    def handle_validate_session(self, request_data):
        """Handle session validation."""
        token = self.get_auth_token(request_data)
        
        if not token:
            self.send_error_response(400, "Token is required")
            return
        
        username = user_manager.validate_session(token)
        
        if username:
            progress = user_manager.get_user_progress(username)
            self.send_json_response({
                "valid": True,
                "username": username,
                "progress": progress
            })
        else:
            self.send_json_response({"valid": False}, 401)
    
    def handle_get_progress(self, request_data):
        """Handle getting user progress."""
        token = self.get_auth_token(request_data)
        
        if not token:
            self.send_error_response(401, "Authentication required")
            return
        
        username = user_manager.validate_session(token)
        if not username:
            self.send_error_response(401, "Invalid session")
            return
        
        progress = user_manager.get_user_progress(username)
        if progress:
            self.send_json_response({"progress": progress})
        else:
            self.send_error_response(404, "User not found")
    
    def handle_save_progress(self, request_data):
        """Handle saving user progress."""
        print(f"🔍 [API DEBUG] Save progress request received")
        
        token = self.get_auth_token(request_data)
        print(f"🔍 [API DEBUG] Auth token provided: {'Yes' if token else 'No'}")
        
        if not token:
            print(f"❌ [API DEBUG] No auth token provided")
            self.send_error_response(401, "Authentication required")
            return
        
        print(f"🔍 [API DEBUG] Validating session...")
        username = user_manager.validate_session(token)
        print(f"🔍 [API DEBUG] Session validation result: {username}")
        
        if not username:
            print(f"❌ [API DEBUG] Invalid session")
            self.send_error_response(401, "Invalid session")
            return
        
        progress_data = request_data.get('progress', {})
        print(f"🔍 [API DEBUG] Progress data provided: {'Yes' if progress_data else 'No'}")
        print(f"🔍 [API DEBUG] Progress data keys: {list(progress_data.keys()) if progress_data else 'None'}")
        
        if not progress_data:
            print(f"❌ [API DEBUG] No progress data provided")
            self.send_error_response(400, "Progress data is required")
            return
        
        print(f"🔍 [API DEBUG] Calling user_manager.save_user_progress...")
        success = user_manager.save_user_progress(username, progress_data)
        print(f"🔍 [API DEBUG] Save progress result: {success}")
        
        if success:
            print(f"✅ [API DEBUG] Progress saved successfully")
            self.send_json_response({"success": True, "message": "Progress saved"})
        else:
            print(f"❌ [API DEBUG] Failed to save progress")
            self.send_error_response(500, "Failed to save progress")
    
    def handle_get_stats(self, request_data):
        """Handle getting user statistics."""
        token = self.get_auth_token(request_data)
        
        if not token:
            self.send_error_response(401, "Authentication required")
            return
        
        username = user_manager.validate_session(token)
        if not username:
            self.send_error_response(401, "Invalid session")
            return
        
        stats = user_manager.get_user_statistics(username)
        if stats:
            self.send_json_response({"statistics": stats})
        else:
            self.send_error_response(404, "User not found")


def main():
    """Start the development server."""
    try:
        # Change to the app directory
        os.chdir(DIRECTORY)
        
        # Ensure users directory exists
        users_dir = DIRECTORY / "users"
        users_dir.mkdir(exist_ok=True)
        
        # Create server
        with socketserver.TCPServer(("", PORT), FlashCardHTTPRequestHandler) as httpd:
            server_url = f"http://localhost:{PORT}"
            
            print(f"🚀 Language Flash Cards Server v2.0")
            print(f"📍 Serving from: {DIRECTORY}")
            print(f"🌐 Server running at: {server_url}")
            print(f"📱 Open the app in your browser")
            print(f"👤 User management: ENABLED")
            print(f"💾 User data stored in: {users_dir}")
            print(f"⏹️  Press Ctrl+C to stop the server")
            print("-" * 50)
            
            # Try to open browser automatically
            try:
                webbrowser.open(server_url)
                print(f"✅ Opened {server_url} in your default browser")
            except Exception as e:
                print(f"⚠️  Could not open browser automatically: {e}")
                print(f"💡 Please manually open: {server_url}")
            
            print("-" * 50)
            print("📡 API Endpoints available:")
            print("   POST /api/register   - Register new user")
            print("   POST /api/login      - User login")
            print("   POST /api/logout     - User logout")
            print("   POST /api/validate   - Validate session")
            print("   GET  /api/progress   - Get user progress")
            print("   POST /api/progress   - Save user progress")
            print("   GET  /api/user/stats - Get user statistics")
            print("-" * 50)
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use")
            print(f"💡 Try using a different port or stop other servers")
        else:
            print(f"❌ Server error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
