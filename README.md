# 💰 Personal Finance Assistant

A comprehensive full-stack web application for managing personal finances with AI-powered features. Track income, expenses, and get intelligent insights about your spending patterns.
## Demo Video Link :https://drive.google.com/file/d/172JIeDBnuJoUywuyyCjUVd1o6TnOANmi/view?usp=sharing

## 🌟 Features

- **💸 Expense & Income Tracking** - Add, categorize, and manage your financial transactions
- **🤖 AI-Powered Categorization** - Automatic transaction categorization using Google Gemini AI
- **📊 Interactive Charts & Analytics** - Visual insights with pie charts, bar charts, and trend analysis
- **📱 Receipt Upload & Processing** - Upload PDF receipts for automatic transaction extraction
- **🔐 User Authentication** - Secure login/registration with JWT tokens
- **🎨 Modern UI** - Beautiful, responsive design built with React and Tailwind CSS
- **📈 Financial Analytics** - Track spending patterns, category-wise analysis, and daily trends
- **🌍 Indian Context** - Built with Indian currency format and local spending categories

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Interactive chart library
- **Lucide React** - Beautiful icon set
- **React Scripts** - Development and build tools

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction
- **Google Gemini AI** - AI categorization

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **Node.js** (version 16.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (version 8.0.0 or higher)
   - Usually comes with Node.js
   - Verify installation: `npm --version`

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **MongoDB Account** (for database)
   - Create a free account at: https://www.mongodb.com/cloud/atlas
   - Or install locally: https://www.mongodb.com/try/download/community

5. **Google Gemini API Key** (for AI features)
   - Get one from: https://makersuite.google.com/app/apikey

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/personal-finance-assistant.git

# Navigate to the project directory
cd personal-finance-assistant
```

### Step 2: Backend Setup

1. **Navigate to the server directory:**
```bash
cd server
```

2. **Install backend dependencies:**
```bash
npm install
```

3. **Environment Configuration:**
   - Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   - Open `.env` file and configure the following variables:
   ```env
   # Environment Configuration
   NODE_ENV=development
   
   # Server Configuration
   PORT=8000
   
   # Database Configuration (MongoDB Atlas)
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/Finance?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
   JWT_EXPIRY=24h
   
   # AI Service Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Security Configuration
   BCRYPT_SALT_ROUNDS=12
   
   # File Upload Configuration
   UPLOAD_DIR=./uploads/
   MAX_FILE_SIZE=5242880
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

4. **MongoDB Setup:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster (free tier available)
   - Create a database user
   - Get your connection string
   - Replace `MONGODB_URI` in your `.env` file

5. **Google Gemini API Setup:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Replace `GEMINI_API_KEY` in your `.env` file

6. **Start the backend server:**
```bash
npm start
```

The server should start on `http://localhost:8000`. You should see:
```
🚀 Server starting...
🌐 Server running on http://localhost:8000
✅ Connected to MongoDB
🎯 Ready to accept requests!
```

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to the frontend directory:**
```bash
cd ../frontend
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Start the frontend development server:**
```bash
npm start
```

The React app should open automatically in your browser at `http://localhost:3000`.


## 🎯 Usage Guide

### 1. **First Time Setup**
- Register a new account with username, email, and password
- Login with your credentials

### 2. **Adding Transactions**
- Go to "Add Transaction" tab
- Fill in transaction details (type, amount, category, description, date)
- Use the "Auto-categorize" feature for AI-powered categorization
- Submit to save the transaction

### 3. **Viewing Analytics**
- Dashboard shows overview with total income, expenses, and balance
- View pie charts for category-wise spending
- Check bar charts for daily expense trends
- Browse all transactions in the "Transactions" tab

### 4. **Upload Receipts**
- Go to "Upload Receipt" tab
- Select a PDF receipt file
- The AI will automatically extract transactions and categorize them
- Review and confirm the extracted transactions

### 5. **Filtering Transactions**
- Use date filters to view transactions for specific periods
- Paginate through large transaction lists
- Sort by date, amount, or category

## 🧪 Test Credentials & Test Files

### Test User Account
For quick testing, you can use these pre-configured test credentials:

```
Username:UserA
Email:usera@example.com
Password:pass123
```

**Note**: If these credentials don't work, simply register a new account with any username/email combination.

### Test Files for Upload Feature

The application includes sample files for testing the receipt upload functionality:

#### PDF Receipt Sample
- **Location**: `server/100 (1).pdf`
- **Description**: Sample PDF receipt for testing PDF upload and AI extraction
- **Usage**: 
  1. Go to "Upload Receipt" tab
  2. Select "PDF Upload" tab
  3. Upload this file to test PDF parsing

#### Image Receipt Sample
- **Location**: `download.png` (in project root)
- **Description**: Sample image receipt for testing image OCR and AI extraction
- **Usage**: 
  1. Go to "Upload Receipt" tab  
  2. Select "Image Upload" tab
  3. Upload this file to test image OCR

### Testing the Upload Features

1. **PDF Upload Test**:
   - Navigate to Upload Receipt → PDF Upload
   - Select `server/100 (1).pdf`
   - The AI should extract transaction details automatically
   - Review and save the extracted transactions

2. **Image Upload Test**:
   - Navigate to Upload Receipt → Image Upload
   - Select any receipt image (JPG, PNG, JPEG)
   - The AI will process the image and extract transaction data
   - Verify the extracted information before saving

3. **Manual Transaction Test**:
   - Go to "Add Transaction"
   - Test the auto-categorization feature
   - Add sample income and expense transactions

## 📁 Project Structure

```
personal-finance-assistant/
├── frontend/                    # React frontend application
│   ├── public/                 # Static files
│   ├── src/                    # Source code
│   │   ├── components/         # Reusable React components
│   │   │   ├── Auth/           # Authentication components
│   │   │   ├── Dashboard/      # Dashboard components
│   │   │   ├── Layout/         # Layout components
│   │   │   ├── Transactions/   # Transaction components
│   │   │   ├── UI/            # UI components
│   │   │   └── Upload/        # File upload components
│   │   ├── contexts/          # React context providers
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Utility functions
│   │   ├── App.js             # Main application component
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Global styles
│   ├── package.json           # Frontend dependencies
│   └── .gitignore             # Git ignore rules
├── server/                     # Node.js backend API
│   ├── config/                # Configuration files
│   │   └── database.js        # Database connection
│   ├── controllers/           # Request handlers
│   │   ├── authController.js  # Authentication logic
│   │   ├── transactionController.js # Transaction logic
│   │   └── uploadController.js # File upload logic
│   ├── middleware/            # Express middleware
│   │   └── index.js           # Authentication & logging
│   ├── models/                # Database models
│   │   ├── User.js            # User schema
│   │   └── Transaction.js     # Transaction schema
│   ├── routes/                # API routes
│   │   ├── auth.js            # Authentication routes
│   │   ├── transactions.js    # Transaction routes
│   │   └── upload.js          # Upload routes
│   ├── services/              # Business logic
│   │   └── aiService.js       # AI categorization service
│   ├── utils/                 # Utility functions
│   │   └── validation.js      # Input validation
│   ├── uploads/               # File upload directory
│   ├── app.js                 # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── .gitignore             # Git ignore rules
├── setup.sh                   # Linux/macOS setup script
├── setup.bat                  # Windows setup script
├── package.json               # Root package configuration
├── README.md                  # This file
└── .git/                      # Git repository
```

## 🔧 Development Scripts

### Frontend Commands:
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Check code quality
npm run format     # Format code with Prettier
```

### Backend Commands:
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Check code quality
```

### Available Test Scripts

The server directory includes several test scripts for development and debugging:

#### Backend Test Scripts
- **`testRegistration.js`** - Test user registration functionality
- **`testAPIs.js`** - Test all API endpoints
- **`testPDF.js`** - Test PDF parsing functionality
- **`test-image-upload.js`** - Test image upload and OCR functionality
- **`createTestUser.js`** - Create sample user for testing
- **`checkDatabase.js`** - Verify database connection and collections
- **`debug_transactions.js`** - Debug transaction-related issues

#### Running Test Scripts
```bash
# Navigate to server directory
cd server

# Run individual test scripts
node testRegistration.js      # Test registration
node testAPIs.js             # Test all APIs
node testPDF.js              # Test PDF upload
node test-image-upload.js    # Test image upload
node createTestUser.js       # Create test user
```

## 🛡️ Security Considerations

- **Environment Variables**: Never commit `.env` files to version control
- **JWT Secret**: Use a strong, unique JWT secret in production
- **Database**: Use MongoDB Atlas with proper authentication
- **CORS**: Configure CORS for your production domain
- **Input Validation**: All user inputs are validated and sanitized
- **File Uploads**: Limited file size and type restrictions

## 🐛 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Verify your `MONGODB_URI` is correct
   - Check if your IP is whitelisted in MongoDB Atlas
   - Ensure database user has proper permissions

2. **Frontend Not Loading**
   - Check if port 3000 is available
   - Clear browser cache and cookies
   - Restart the development server

3. **Backend API Errors**
   - Verify all environment variables are set
   - Check if port 8000 is available
   - Look at server logs for specific error messages

4. **AI Categorization Not Working**
   - Verify your `GEMINI_API_KEY` is valid
   - Check API quotas and limits
   - Ensure you have internet connectivity

### Getting Help:

- Check the browser console for frontend errors
- Check the terminal/server logs for backend errors
- Verify all dependencies are installed correctly
- Ensure all environment variables are properly configured

## 🚀 Deployment

### Backend Deployment (Heroku/Vercel/Railway):
1. Set all environment variables in your hosting platform
2. Ensure `NODE_ENV=production`
3. Configure production MongoDB connection
4. Update CORS settings for your frontend domain

### Frontend Deployment (Netlify/Vercel):
1. Update API base URL to your backend domain
2. Build the project: `npm run build`
3. Deploy the `build` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent categorization
- MongoDB Atlas for cloud database hosting
- React and Express.js communities
- Recharts for beautiful data visualization
- Tailwind CSS for rapid UI development

### Sample Transaction Data
For manual testing, you can add these sample transactions:

```
Income:
- Type: Income, Amount: 50000, Category: Salary, Description: Monthly salary

Expenses:
- Type: Expense, Amount: 15000, Category: Rent, Description: Monthly rent
- Type: Expense, Amount: 3000, Category: Groceries, Description: Weekly groceries
- Type: Expense, Amount: 800, Category: Transportation, Description: Uber rides
- Type: Expense, Amount: 1200, Category: Utilities, Description: Electricity bill
```

## 📞 Support

If you encounter any issues or have questions:

1. Check this README file
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Join our community discussions

---


env contents in case of git ignore
# Environment Configuration
NODE_ENV=development

# Server Configuration
PORT=8000

# Database Configuration
MONGODB_URI=mongodb+srv://sarvamangalapoojitha:mongo@cluster1.xkopp.mongodb.net/Finance?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long_12345678
JWT_EXPIRY=24h

# AI Service Configuration
GEMINI_API_KEY=AIzaSyDxG_Dn27XZ-OSeg_iWbGduohqD9gYrGiI

# Security Configuration
BCRYPT_SALT_ROUNDS=12

# File Upload Configuration
UPLOAD_DIR=./uploads/
MAX_FILE_SIZE=5242880

# API Configuration
API_TIMEOUT=10000

# CORS Configuration (for production, replace with your frontend domain)
FRONTEND_URL=http://localhost:3000

# Optional: Database connection pool settings
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=5


**Happy Financial Tracking! 💰📊**
