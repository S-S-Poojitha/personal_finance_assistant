#!/bin/bash

# Personal Finance Assistant Setup Script
# This script will help you set up the entire project

echo "🚀 Personal Finance Assistant Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
echo ""
print_info "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm (usually comes with Node.js)"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

print_status "Node.js version: $NODE_VERSION"
print_status "npm version: $NPM_VERSION"

# Install root dependencies
echo ""
print_info "Installing root dependencies..."
npm install

# Install frontend dependencies
echo ""
print_info "Installing frontend dependencies..."
cd frontend
npm install
print_status "Frontend dependencies installed"

# Install backend dependencies
echo ""
print_info "Installing backend dependencies..."
cd ../server
npm install
print_status "Backend dependencies installed"

# Check if .env file exists
echo ""
print_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_info "Copying .env.example to .env..."
    cp .env.example .env
    print_status ".env file created"
    echo ""
    print_warning "IMPORTANT: Please edit the .env file with your actual configuration:"
    print_warning "1. Set your MongoDB connection string (MONGODB_URI)"
    print_warning "2. Set your Google Gemini API key (GEMINI_API_KEY)"
    print_warning "3. Set a secure JWT secret (JWT_SECRET)"
else
    print_status ".env file already exists"
fi

# Create uploads directory
echo ""
print_info "Creating uploads directory..."
mkdir -p uploads
print_status "Uploads directory created"

# Go back to root directory
cd ..

echo ""
print_status "Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Configure your .env file in the server directory"
echo "2. Set up your MongoDB database"
echo "3. Get your Google Gemini API key"
echo "4. Start the backend: cd server && npm start"
echo "5. Start the frontend: cd frontend && npm start"
echo ""
echo "📚 For detailed instructions, see the README.md file"
echo ""
print_status "Happy coding! 💰📊"
