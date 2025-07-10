#!/usr/bin/env python3
"""
Initialization script for Language Flashcards application.
This script initializes the file-based user management system.
"""

from pathlib import Path

if __name__ == "__main__":
    # Create users directory if it doesn't exist
    users_dir = Path("users")
    users_dir.mkdir(exist_ok=True)
    print("✅ File-based user system initialized successfully!")
    print(f"✅ User data will be stored in: {users_dir.absolute()}")
