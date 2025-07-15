import dotenv from "dotenv"
import connectDB from './db/index.js'
import {app} from "./app.js"
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Configure environment variables
dotenv.config({
    path: './.env'
})

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "..", "public", "uploads")
try {
    if (!fs.existsSync(uploadsDir)){
        fs.mkdirSync(uploadsDir, { recursive: true })
        console.log("Uploads directory created successfully")
    }
} catch (error) {
    console.error("Error creating uploads directory:", error)
    process.exit(1)
}

const PORT = process.env.PORT || 8000

// Start server
const startServer = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`)
        })
    } catch (error) {
        console.error("MongoDB connection FAILED!!!", error)
        process.exit(1)
    }
}

startServer()