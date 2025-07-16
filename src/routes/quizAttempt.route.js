import { Router } from "express";
const router = Router();
import {
    startQuizAttempt,
    submitQuizAttempt,
    getMyQuizAttempts,
    getQuizAttemptDetails,
    getAllQuizAttempts,
    getQuizAttemptStats,
    deleteQuizAttempt
} from "../controllers/quizAttempt.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// User routes (authentication required)
router.route("/start/:quizId").post(verifyJWT, startQuizAttempt);
router.route("/submit/:attemptId").post(verifyJWT, submitQuizAttempt);
router.route("/quiz/:quizId/my-attempts").get(verifyJWT, getMyQuizAttempts);
router.route("/:attemptId").get(verifyJWT, getQuizAttemptDetails);

// Admin routes (authentication + admin role required)
router.route("/admin/all").get(verifyJWT, getAllQuizAttempts);
router.route("/admin/quiz/:quizId/stats").get(verifyJWT, getQuizAttemptStats);
router.route("/admin/:attemptId").delete(verifyJWT, deleteQuizAttempt);

export { router };