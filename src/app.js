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


// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/course", courseRouter);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    })
})

export { app }