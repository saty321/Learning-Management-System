import { Router } from "express";
const router = Router();
import {
    createLesson,
    updateLesson,
    deleteLesson,
    getAllLessonsByCourse,
    getLessonDetails
} from "../controllers/lesson.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Public routes (no authentication required)
router.route("/course/:courseId").get(getAllLessonsByCourse)
router.route("/:lessonId").get(getLessonDetails)

// Admin only routes (authentication + admin role required)
router.route("/create").post(verifyJWT, createLesson)
router.route("/:lessonId").patch(verifyJWT, updateLesson)
router.route("/:lessonId").delete(verifyJWT, deleteLesson)

export { router }