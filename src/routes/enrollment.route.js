import { Router } from "express";
const router = Router();
import {
    enrollInCourse,
    getMyEnrollments,
    getEnrollmentDetails,
    updateLastAccessed,
    getAllEnrollments,
    updateEnrollment,
    deleteEnrollment,
    getCourseEnrollmentStats
} from "../controllers/enrollment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Public routes
router.route("/course/:courseId/stats").get(getCourseEnrollmentStats)

// User routes (authentication required)
router.route("/enroll/:courseId").post(verifyJWT, enrollInCourse)
router.route("/my-enrollments").get(verifyJWT, getMyEnrollments)
router.route("/:enrollmentId").get(verifyJWT, getEnrollmentDetails)
router.route("/:enrollmentId/access").patch(verifyJWT, updateLastAccessed)

// Admin routes (authentication + admin role required)
router.route("/admin/all").get(verifyJWT, getAllEnrollments)
router.route("/admin/:enrollmentId").patch(verifyJWT, updateEnrollment)
router.route("/admin/:enrollmentId").delete(verifyJWT, deleteEnrollment)

export { router }