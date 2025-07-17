import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

// Increase limit for file uploads
app.use(express.json({limit: "16mb"}))
app.use(express.urlencoded({
    extended: true,
    limit: "16mb"
}))

// Serve static files from the public directory at root level
app.use(express.static(path.join(path.dirname(process.cwd()), "public")))
app.use(cookieParser())

// Route imports
import { router as userRouter } from "./routes/user.route.js"
import { router as courseRouter } from "./routes/course.route.js"
import { router as lessonRouter } from "./routes/lesson.route.js"
import { router as quizRouter } from "./routes/quiz.route.js"
import { router as questionRouter } from "./routes/question.route.js"
import { router as enrollmentRouter } from "./routes/enrollment.route.js"
import { router as progressRouter } from "./routes/progress.route.js"
import { router as quizAttemptRouter } from "./routes/quizAttempt.route.js"


// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/lesson", lessonRouter);
app.use("/api/v1/quiz", quizRouter);
app.use("/api/v1/question", questionRouter);
app.use("/api/v1/enrollment", enrollmentRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/quizAttempt", quizAttemptRouter);

app.get("/", (req, res) => {
    // Check if the request accepts HTML
    if (req.accepts('html')) {
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Learning Management System API</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 20px;
                }
                h1 {
                    color: #2c3e50;
                }
                h2 {
                    color: #3498db;
                    margin-top: 30px;
                }
                .container {
                    background-color: #f9f9f9;
                    border-radius: 5px;
                    padding: 20px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .endpoint {
                    background-color: #fff;
                    border-left: 4px solid #3498db;
                    padding: 10px 15px;
                    margin-bottom: 10px;
                    border-radius: 0 5px 5px 0;
                }
                .endpoint h3 {
                    margin-top: 0;
                    margin-bottom: 5px;
                    color: #2c3e50;
                }
                .endpoint p {
                    margin: 0;
                    color: #7f8c8d;
                }
                code {
                    background-color: #f0f0f0;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                    color: #e74c3c;
                }
                .admin-info {
                    background-color: #eafaf1;
                    border-left: 4px solid #2ecc71;
                    padding: 15px;
                    margin-top: 30px;
                    border-radius: 0 5px 5px 0;
                }
                footer {
                    text-align: center;
                    margin-top: 50px;
                    color: #7f8c8d;
                    font-size: 0.9em;
                }
                a {
                    color: #3498db;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <header>
                <h1>Learning Management System API</h1>
                <p>A comprehensive backend for an LMS with user authentication, courses, lessons, quizzes, and progress tracking.</p>
            </header>
            <div class="container">
                <h2>API Endpoints</h2>
                
                <div class="endpoint">
                    <h3>User APIs</h3>
                    <p>Register, login, logout, refresh token, change password, etc.</p>
                    <code>GET/POST/PATCH /api/v1/users/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Course APIs</h3>
                    <p>Create, update, delete, list, and search courses</p>
                    <code>GET/POST/PATCH/DELETE /api/v1/course/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Lesson APIs</h3>
                    <p>Manage course lessons and their contents</p>
                    <code>GET/POST/PATCH/DELETE /api/v1/lesson/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Quiz APIs</h3>
                    <p>Manage quizzes within courses</p>
                    <code>GET/POST/PATCH/DELETE /api/v1/quiz/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Question APIs</h3>
                    <p>Manage questions within quizzes</p>
                    <code>GET/POST/PATCH/DELETE /api/v1/question/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Enrollment APIs</h3>
                    <p>Enroll in courses and manage enrollments</p>
                    <code>GET/POST/PATCH/DELETE /api/v1/enrollment/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Progress APIs</h3>
                    <p>Track and manage course progress</p>
                    <code>GET/POST/PATCH /api/v1/progress/...</code>
                </div>
                
                <div class="endpoint">
                    <h3>Quiz Attempt APIs</h3>
                    <p>Start, submit, and track quiz attempts</p>
                    <code>GET/POST /api/v1/quiz-attempt/...</code>
                </div>
                
                <div class="admin-info">
                    <h3>Admin Access</h3>
                    <p>For testing admin functionality, use these credentials:</p>
                    <p><strong>Email:</strong> ajsatyamaj123+admin@gmail.com</p>
                    <p><strong>Password:</strong> admin@123</p>
                </div>
                
                <h2>Documentation</h2>
                <p>For detailed API documentation, please refer to the <a href="https://github.com/saty321/Learning-Management-System" target="_blank">GitHub repository(master branch)</a>.</p>
            </div>
            
            <footer>
                <p>Created by Satyam Kumar &copy; ${new Date().getFullYear()}</p>
                <p>Version 1.0.0</p>
            </footer>
        </body>
        </html>
        `);
    } else {
        // If the client prefers JSON
        res.json({
            success: true,
            message: "Welcome to the Learning Management System API",
            description: "A comprehensive backend for an LMS with user authentication, courses, lessons, quizzes, and progress tracking.",
            documentation: "For detailed API documentation, please refer to the GitHub repository: https://github.com/saty321/Learning-Management-System",
            version: "1.0.0",
            author: "Satyam Kumar",
            endpoints: {
                users: "/api/v1/users",
                courses: "/api/v1/course",
                lessons: "/api/v1/lesson",
                quizzes: "/api/v1/quizz",
                questions: "/api/v1/question",
                enrollments: "/api/v1/enrollment",
                progress: "/api/v1/progress",
                quizAttempts: "/api/v1/quiz-attempt"
            },
            adminLogin: {
                email: "ajsatyamaj123+admin@gmail.com",
                password: "admin@123"
            },
            note: "This is a RESTful API. Please use appropriate HTTP methods with the endpoints."
        });
    }
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

export { app }