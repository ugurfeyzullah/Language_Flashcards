#!/bin/bash
# deployment.sh - Deployment script for Language Flashcards application

# Step 1: Initialize the database
echo "Initializing database..."
python init_db.py

# Step 2: Start the server
echo "Starting server..."
python server.py
