import { Router } from "express";
const router = Router();
import {
    createCourse,
    updateCourse,
    deleteCourse,
    getAllCourses,
    getCourseDetails,
    searchCourses
} from "../controllers/course.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Public routes (no authentication required)
router.route("/").get(getAllCourses)
router.route("/search").get(searchCourses)
router.route("/:courseId").get(getCourseDetails)

// Admin only routes (authentication + admin role required)
router.route("/create").post(verifyJWT, createCourse)
router.route("/:courseId").patch(verifyJWT, updateCourse)
router.route("/:courseId").delete(verifyJWT, deleteCourse)

export {router}