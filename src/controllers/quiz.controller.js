import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Quiz } from "../models/quiz.model.js";
import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Admin only - Create Quiz
const createQuiz = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can create quizzes");
    }

    const { course, title, description, passingScore, timeLimit, maxAttempts, isPublished, order } = req.body;

    // Validate required fields
    if ([course, title].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Course ID and title are required");
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

    // Check if quiz with same order already exists in the course
    const existingQuiz = await Quiz.findOne({ 
        course: course.trim(), 
        order: Number(order) 
    });
    if (existingQuiz) {
        throw new ApiError(409, "Quiz with this order already exists in the course");
    }

    // Validate optional fields
    if (passingScore !== undefined && (passingScore < 0 || passingScore > 100)) {
        throw new ApiError(400, "Passing score must be between 0 and 100");
    }
    if (timeLimit !== undefined && timeLimit < 1) {
        throw new ApiError(400, "Time limit must be at least 1 minute");
    }
    if (maxAttempts !== undefined && maxAttempts < 1) {
        throw new ApiError(400, "Max attempts must be at least 1");
    }

    // Create quiz
    const quiz = await Quiz.create({
        course: course.trim(),
        title: title.trim(),
        description: description?.trim() || "",
        passingScore: passingScore !== undefined ? Number(passingScore) : 70,
        timeLimit: timeLimit !== undefined ? Number(timeLimit) : 30,
        maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : 3,
        isPublished: isPublished || false,
        order: Number(order)
    });

    if (!quiz) {
        throw new ApiError(500, "Something went wrong while creating the quiz");
    }

    return res.status(201).json(
        new ApiResponse(201, quiz, "Quiz created successfully")
    );
});

// Admin only - Update Quiz
const updateQuiz = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can update quizzes");
    }

    const { quizId } = req.params;
    const { course, title, description, passingScore, timeLimit, maxAttempts, isPublished, order } = req.body;

    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Validate fields if provided
    if (course && course.trim() === "") {
        throw new ApiError(400, "Course ID cannot be empty");
    }
    if (title && title.trim() === "") {
        throw new ApiError(400, "Title cannot be empty");
    }
    if (order !== undefined && (order === null || order < 1)) {
        throw new ApiError(400, "Order must be a positive number");
    }
    if (passingScore !== undefined && (passingScore < 0 || passingScore > 100)) {
        throw new ApiError(400, "Passing score must be between 0 and 100");
    }
    if (timeLimit !== undefined && timeLimit < 1) {
        throw new ApiError(400, "Time limit must be at least 1 minute");
    }
    if (maxAttempts !== undefined && maxAttempts < 1) {
        throw new ApiError(400, "Max attempts must be at least 1");
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

    // Check if quiz with same order already exists in the course (if order or course is being updated)
    if (order !== undefined || course) {
        const courseToCheck = course ? course.trim() : quiz.course;
        const orderToCheck = order !== undefined ? Number(order) : quiz.order;
        
        const existingQuiz = await Quiz.findOne({
            _id: { $ne: quizId },
            course: courseToCheck,
            order: orderToCheck
        });
        
        if (existingQuiz) {
            throw new ApiError(409, "Quiz with this order already exists in the course");
        }
    }

    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
        quizId,
        {
            $set: {
                ...(course && { course: course.trim() }),
                ...(title && { title: title.trim() }),
                ...(description !== undefined && { description: description?.trim() || "" }),
                ...(passingScore !== undefined && { passingScore: Number(passingScore) }),
                ...(timeLimit !== undefined && { timeLimit: Number(timeLimit) }),
                ...(maxAttempts !== undefined && { maxAttempts: Number(maxAttempts) }),
                ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
                ...(order !== undefined && { order: Number(order) })
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedQuiz, "Quiz updated successfully")
    );
});

// Admin only - Delete Quiz
const deleteQuiz = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can delete quizzes");
    }

    const { quizId } = req.params;

    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // Check if quiz exists and delete
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Quiz deleted successfully")
    );
});

// Public - Get All Quizzes for a Course
const getAllQuizzesByCourse = asyncHandler(async (req, res) => {
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

    const quizzes = await Quiz.find({ course: courseId })
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalQuizzes = await Quiz.countDocuments({ course: courseId });

    return res.status(200).json(
        new ApiResponse(200, {
            quizzes,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalQuizzes / limitNumber),
                totalQuizzes,
                hasNext: pageNumber < Math.ceil(totalQuizzes / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "Quizzes fetched successfully")
    );
});

// Public - Get Quiz Details
const getQuizDetails = asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    return res.status(200).json(
        new ApiResponse(200, quiz, "Quiz details fetched successfully")
    );
});

export {
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getAllQuizzesByCourse,
    getQuizDetails
};