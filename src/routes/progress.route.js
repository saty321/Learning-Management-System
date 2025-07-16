import { Router } from "express";
const router = Router();
import {
  getCourseProgress,
  getUserProgress,
  createOrUpdateProgress,
  markLessonCompleted,
  updateQuizProgress,
  resetCourseProgress,
  getCourseProgressStats,
  getAllProgress,
  deleteProgress
} from "../controllers/progress.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Public routes
router.route("/course/:courseId/stats").get(getCourseProgressStats);

// User routes (authentication required)
router.route("/my-progress").get(verifyJWT, getUserProgress);
router.route("/course/:courseId").get(verifyJWT, getCourseProgress);
router.route("/course/:courseId").post(verifyJWT, createOrUpdateProgress);
router.route("/course/:courseId/lesson/:lessonId/complete").patch(verifyJWT, markLessonCompleted);
router.route("/course/:courseId/quiz").patch(verifyJWT, updateQuizProgress);
router.route("/course/:courseId/reset").patch(verifyJWT, resetCourseProgress);

// Admin routes (authentication + admin role required)
router.route("/admin/all").get(verifyJWT, getAllProgress);
router.route("/admin/:progressId").delete(verifyJWT, deleteProgress);

export { router };