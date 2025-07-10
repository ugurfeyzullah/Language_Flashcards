#!/usr/bin/env python3
"""
Startup script for the Language Flash Cards application.
This script starts the application using the file-based user management system.
"""

from app import app

# Run the application
if __name__ == "__main__":
    # Default port for most hosting providers
    port = 5000
    
    # Start the server
    print(f"🚀 Starting Language Flash Cards server on port {port}...")
    app.run(host="0.0.0.0", port=port)
