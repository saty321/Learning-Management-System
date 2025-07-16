import { Router } from "express";
const router = Router();
import {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestionsByQuiz,
    getQuestionDetails
} from "../controllers/question.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Public routes (no authentication required)
router.route("/quiz/:quizId").get(getAllQuestionsByQuiz)
router.route("/:questionId").get(getQuestionDetails)

// Admin only routes (authentication + admin role required)
router.route("/create").post(verifyJWT, createQuestion)
router.route("/:questionId").patch(verifyJWT, updateQuestion)
router.route("/:questionId").delete(verifyJWT, deleteQuestion)

export { router }