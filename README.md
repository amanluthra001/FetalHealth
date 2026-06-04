# Pregnancy Health Monitoring App

A comprehensive web application for maternal and fetal health monitoring, featuring user authentication, health assessments, and AI-powered predictions using machine learning.

## Features

### Frontend (Static Web App)
- **Patient Dashboard**: Health monitoring, kick counter, nutrition tracking, exercise guidance
- **Doctor Portal**: Patient management, health assessments
- **Health Monitoring**: Fetal development tracking, mental health support
- **Emergency Access**: Quick access to emergency resources
- **Responsive Design**: Dark/light theme toggle

### Backend (Node.js/Express)
- **Authentication**: JWT-based login/registration for patients and doctors
- **API Endpoints**:
  - `/api/auth`: User authentication
  - `/api/patient`: Patient profiles and assessments
  - `/api/doctor`: Doctor profiles and patient management
- **Database**: MongoDB for user data and health records
- **Security**: CORS, cookie-based auth, password hashing

### Machine Learning Service (Python/Flask)
- **Fetal Health Prediction**: Gaussian Naive Bayes model for fetal health classification
- **Maternal Risk Assessment**: Custom decision tree model for maternal health risk prediction
- **Real-time Predictions**: REST API for health assessments

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **ML Service**: Python, Flask, scikit-learn, pandas
- **Deployment**:
  - Frontend: Vercel (static hosting)
  - Backend: Render (Node.js web service)
  - ML Service: Render (Python/Docker web service)
- **Authentication**: JWT, bcrypt
- **Styling**: Custom CSS with theme support
