# Learning Management System (LMS) API

A robust backend API for a Learning Management System that enables user authentication, course management, lessons, quizzes, and progress tracking.

## 🚀 Features

- **User Authentication**
  - JWT-based authentication
  - User registration and login
  - Password management
  - Role-based access control (Admin/User)

- **Course Management**
  - Create, update, and delete courses (Admin)
  - List all courses with pagination and search
  - View detailed course information

- **Lessons**
  - Create and manage lessons within courses
  - Video content and resource links
  - Ordered learning paths

- **Quizzes & Questions**
  - Multiple-choice questions with scoring
  - Quiz attempt tracking
  - Performance statistics
  - Detailed feedback on answers

- **Progress Tracking**
  - Mark lessons as completed
  - Track quiz performance
  - Calculate overall course completion percentage
  - Course enrollment management

- **Advanced Features**
  - Pagination on all list endpoints
  - Input validation and error handling
  - Comprehensive API documentation
  - Rate limiting and security measures

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Error Handling**: Custom middleware for consistent responses
- **Deployment**: Heroku

## 📝 API Documentation

The API is fully documented and can be tested using Postman:

- **Base URL**: `https://lms-project-1b0e4fb104ab.herokuapp.com`

For detailed API documentation, refer to the [API Documentation](https://documenter.getpostman.com/view/your-collection-id/your-documentation-id) or import the Postman collection from the `postman` directory.

## 📋 API Endpoints Overview

### User APIs
- Register User
- Login User
- Logout User
- Refresh Access Token
- Change Password
- Get Current User
- Update Account Details

### Course APIs
- Create Course (Admin)
- Update Course (Admin)
- Delete Course (Admin)
- Get All Courses
- Get Course Details
- Search Courses

### Lesson APIs
- Create Lesson (Admin)
- Update Lesson (Admin)
- Delete Lesson (Admin)
- Get All Lessons by Course
- Get Lesson Details

### Quiz APIs
- Create Quiz (Admin)
- Update Quiz (Admin)
- Delete Quiz (Admin)
- Get All Quizzes by Course
- Get Quiz Details

### Question APIs
- Create Question (Admin)
- Update Question (Admin)
- Delete Question (Admin)
- Get All Questions by Quiz
- Get Question Details

### Enrollment APIs
- Enroll in Course
- Get My Enrollments
- Get Enrollment Details
- Update Last Accessed
- Get Course Enrollment Stats
- Admin Enrollment Management

### Progress APIs
- Get Course Progress
- Get User Progress
- Create/Update Progress
- Mark Lesson Completed
- Update Quiz Progress
- Reset Course Progress
- Get Course Progress Stats

### Quiz Attempt APIs
- Start Quiz Attempt
- Submit Quiz Attempt
- Get My Quiz Attempts
- Get Quiz Attempt Details
- Quiz Attempt Statistics

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/learning-management-system.git
cd learning-management-system
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=8000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_EXPIRY=30d
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. The API will be available at `http://localhost:8000`

## 🧪 Testing

Run the test suite with:
```bash
npm test
# or
yarn test
```

## 📦 Project Structure

```
├── config/             # Configuration files
├── controllers/        # Request handlers
├── middlewares/        # Custom middlewares
├── models/             # Database models
├── routes/             # API routes
├── utils/              # Utility functions
├── validators/         # Input validation schemas
├── app.js              # Express application
├── server.js           # Server entry point
└── package.json        # Dependencies and scripts
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Register or login to receive access and refresh tokens
2. Include the access token in the Authorization header for protected routes:
   ```
   Authorization: Bearer <access_token>
   ```
3. Use the refresh token endpoint to get a new access token when it expires

## 🌟 Future Enhancements

- Real-time notifications using WebSockets
- File upload for course materials
- Discussion forums and comment sections
- Payment integration for premium courses
- Certificate generation upon course completion
- Analytics dashboard for instructors

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

- Your Name - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)