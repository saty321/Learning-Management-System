import { Router } from "express";
const router = Router();
import {
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getAllQuizzesByCourse,
    getQuizDetails
} from "../controllers/quiz.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Public routes (no authentication required)
router.route("/course/:courseId").get(getAllQuizzesByCourse)
router.route("/:quizId").get(getQuizDetails)

// Admin only routes (authentication + admin role required)
router.route("/create").post(verifyJWT, createQuiz)
router.route("/:quizId").patch(verifyJWT, updateQuiz)
router.route("/:quizId").delete(verifyJWT, deleteQuiz)

export { router }