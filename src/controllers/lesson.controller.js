import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Lesson } from "../models/lesson.model.js";
import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Admin only - Create Lesson
const createLesson = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can create lessons");
    }

    const { course, title, videoUrl, resourceLinks, order, duration, description, isPublished } = req.body;

    // Validate required fields
    if ([course, title, videoUrl].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Course ID, title, and video URL are required");
    }

    if (order === undefined || order === null || order < 1) {
        throw new ApiError(400, "Order is required and must be a positive number");
    }

    // Validate course exists
    if (!mongoose.isValidObjectId(course)) {
        throw new ApiError(400, "Invalid course ID");
    }

    const courseExists = await Course.findById(course);
    if (!courseExists) {
        throw new ApiError(404, "Course not found");
    }

    // Check if lesson with same order already exists in the course
    const existingLesson = await Lesson.findOne({ 
        course: course.trim(), 
        order: Number(order) 
    });
    if (existingLesson) {
        throw new ApiError(409, "Lesson with this order already exists in the course");
    }

    // Validate duration if provided
    if (duration !== undefined && (duration < 0)) {
        throw new ApiError(400, "Duration must be a non-negative number");
    }

    // Validate resource links if provided
    let validatedResourceLinks = [];
    if (resourceLinks && Array.isArray(resourceLinks)) {
        validatedResourceLinks = resourceLinks.filter(link => link && link.trim() !== "");
    }

    // Create lesson
    const lesson = await Lesson.create({
        course: course.trim(),
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        resourceLinks: validatedResourceLinks,
        order: Number(order),
        duration: duration ? Number(duration) : 0,
        description: description?.trim() || "",
        isPublished: isPublished || false
    });

    if (!lesson) {
        throw new ApiError(500, "Something went wrong while creating the lesson");
    }

    return res.status(201).json(
        new ApiResponse(201, lesson, "Lesson created successfully")
    );
});

// Admin only - Update Lesson
const updateLesson = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can update lessons");
    }

    const { lessonId } = req.params;
    const { course, title, videoUrl, resourceLinks, order, duration, description, isPublished } = req.body;

    // Validate lessonId
    if (!mongoose.isValidObjectId(lessonId)) {
        throw new ApiError(400, "Invalid lesson ID");
    }

    // Check if lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    // Validate fields if provided
    if (course && course.trim() === "") {
        throw new ApiError(400, "Course ID cannot be empty");
    }
    if (title && title.trim() === "") {
        throw new ApiError(400, "Title cannot be empty");
    }
    if (videoUrl && videoUrl.trim() === "") {
        throw new ApiError(400, "Video URL cannot be empty");
    }
    if (order !== undefined && (order === null || order < 1)) {
        throw new ApiError(400, "Order must be a positive number");
    }
    if (duration !== undefined && duration < 0) {
        throw new ApiError(400, "Duration must be a non-negative number");
    }

    // Validate course exists if course is being updated
    if (course && course.trim() !== "") {
        if (!mongoose.isValidObjectId(course)) {
            throw new ApiError(400, "Invalid course ID");
        }
        const courseExists = await Course.findById(course);
        if (!courseExists) {
            throw new ApiError(404, "Course not found");
        }
    }

    // Check if lesson with same order already exists in the course (if order or course is being updated)
    if (order !== undefined || course) {
        const courseToCheck = course ? course.trim() : lesson.course;
        const orderToCheck = order !== undefined ? Number(order) : lesson.order;
        
        const existingLesson = await Lesson.findOne({
            _id: { $ne: lessonId },
            course: courseToCheck,
            order: orderToCheck
        });
        
        if (existingLesson) {
            throw new ApiError(409, "Lesson with this order already exists in the course");
        }
    }

    // Validate resource links if provided
    let validatedResourceLinks;
    if (resourceLinks && Array.isArray(resourceLinks)) {
        validatedResourceLinks = resourceLinks.filter(link => link && link.trim() !== "");
    }

    // Update lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
        lessonId,
        {
            $set: {
                ...(course && { course: course.trim() }),
                ...(title && { title: title.trim() }),
                ...(videoUrl && { videoUrl: videoUrl.trim() }),
                ...(validatedResourceLinks && { resourceLinks: validatedResourceLinks }),
                ...(order !== undefined && { order: Number(order) }),
                ...(duration !== undefined && { duration: Number(duration) }),
                ...(description !== undefined && { description: description?.trim() || "" }),
                ...(isPublished !== undefined && { isPublished: Boolean(isPublished) })
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedLesson, "Lesson updated successfully")
    );
});

// Admin only - Delete Lesson
const deleteLesson = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can delete lessons");
    }

    const { lessonId } = req.params;

    // Validate lessonId
    if (!mongoose.isValidObjectId(lessonId)) {
        throw new ApiError(400, "Invalid lesson ID");
    }

    // Check if lesson exists and delete
    const lesson = await Lesson.findByIdAndDelete(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Lesson deleted successfully")
    );
});

// Public - Get All Lessons for a Course
const getAllLessonsByCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sortBy = "order", sortOrder = "asc" } = req.query;

    // Validate courseId
    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    // Check if course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
        throw new ApiError(404, "Course not found");
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const lessons = await Lesson.find({ course: courseId })
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalLessons = await Lesson.countDocuments({ course: courseId });

    return res.status(200).json(
        new ApiResponse(200, {
            lessons,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalLessons / limitNumber),
                totalLessons,
                hasNext: pageNumber < Math.ceil(totalLessons / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "Lessons fetched successfully")
    );
});

// Public - Get Lesson Details
const getLessonDetails = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;

    // Validate lessonId
    if (!mongoose.isValidObjectId(lessonId)) {
        throw new ApiError(400, "Invalid lesson ID");
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new ApiError(404, "Lesson not found");
    }

    return res.status(200).json(
        new ApiResponse(200, lesson, "Lesson details fetched successfully")
    );
});

export {
    createLesson,
    updateLesson,
    deleteLesson,
    getAllLessonsByCourse,
    getLessonDetails
};