import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Admin only - Create Course
const createCourse = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can create courses");
    }

    const { title, description, instructorName, price } = req.body;

    // Validate required fields
    if ([title, description, instructorName].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title, description, and instructor name are required");
    }

    if (price === undefined || price === null || price < 0) {
        throw new ApiError(400, "Price is required and must be a non-negative number");
    }

    // Check if course with same title already exists
    const existingCourse = await Course.findOne({ title: title.trim() });
    if (existingCourse) {
        throw new ApiError(409, "Course with this title already exists");
    }

    // Create course
    const course = await Course.create({
        user: req.user.username || req.user.email,
        title: title.trim(),
        description: description.trim(),
        instructorName: instructorName.trim(),
        price: Number(price)
    });

    if (!course) {
        throw new ApiError(500, "Something went wrong while creating the course");
    }

    return res.status(201).json(
        new ApiResponse(201, course, "Course created successfully")
    );
});

// Admin only - Update Course
const updateCourse = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can update courses");
    }

    const { courseId } = req.params;
    const { title, description, instructorName, price } = req.body;

    // Validate courseId
    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Validate fields if provided
    if (title && title.trim() === "") {
        throw new ApiError(400, "Title cannot be empty");
    }
    if (description && description.trim() === "") {
        throw new ApiError(400, "Description cannot be empty");
    }
    if (instructorName && instructorName.trim() === "") {
        throw new ApiError(400, "Instructor name cannot be empty");
    }
    if (price !== undefined && (price === null || price < 0)) {
        throw new ApiError(400, "Price must be a non-negative number");
    }

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
            $set: {
                ...(title && { title: title.trim() }),
                ...(description && { description: description.trim() }),
                ...(instructorName && { instructorName: instructorName.trim() }),
                ...(price !== undefined && { price: Number(price) })
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedCourse, "Course updated successfully")
    );
});

// Admin only - Delete Course
const deleteCourse = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can delete courses");
    }

    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    // Check if course exists and delete
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Course deleted successfully")
    );
});

// Public - Get All Courses
const getAllCourses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const courses = await Course.find({})
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalCourses = await Course.countDocuments();

    return res.status(200).json(
        new ApiResponse(200, {
            courses,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCourses / limitNumber),
                totalCourses,
                hasNext: pageNumber < Math.ceil(totalCourses / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "Courses fetched successfully")
    );
});

// Public - Get Course Details
const getCourseDetails = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    return res.status(200).json(
        new ApiResponse(200, course, "Course details fetched successfully")
    );
});

// Public - Search Courses
const searchCourses = asyncHandler(async (req, res) => {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim() === "") {
        throw new ApiError(400, "Search query is required");
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const searchRegex = new RegExp(query.trim(), "i");

    const courses = await Course.find({
        $or: [
            { title: searchRegex },
            { description: searchRegex },
            { instructorName: searchRegex }
        ]
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const totalCourses = await Course.countDocuments({
        $or: [
            { title: searchRegex },
            { description: searchRegex },
            { instructorName: searchRegex }
        ]
    });

    return res.status(200).json(
        new ApiResponse(200, {
            courses,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalCourses / limitNumber),
                totalCourses,
                hasNext: pageNumber < Math.ceil(totalCourses / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "Search results fetched successfully")
    );
});

export {
    createCourse,
    updateCourse,
    deleteCourse,
    getAllCourses,
    getCourseDetails,
    searchCourses
};