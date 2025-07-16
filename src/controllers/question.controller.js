import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Question } from "../models/question.model.js";
import { Quiz } from "../models/quiz.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Admin only - Create Question
const createQuestion = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can create questions");
    }

    const { quiz, questionText, options, correctAnswer, points, order, explanation, difficulty } = req.body;

    // Validate required fields
    if ([quiz, questionText].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Quiz ID and question text are required");
    }

    if (order === undefined || order === null || order < 1) {
        throw new ApiError(400, "Order is required and must be a positive number");
    }

    if (correctAnswer === undefined || correctAnswer === null || correctAnswer < 0 || correctAnswer > 3) {
        throw new ApiError(400, "Correct answer is required and must be between 0 and 3");
    }

    // Validate quiz exists
    if (!mongoose.isValidObjectId(quiz)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    const quizExists = await Quiz.findById(quiz);
    if (!quizExists) {
        throw new ApiError(404, "Quiz not found");
    }

    // Validate options
    if (!Array.isArray(options) || options.length !== 4) {
        throw new ApiError(400, "Exactly 4 options are required");
    }

    if (options.some((option) => !option || option.trim() === "")) {
        throw new ApiError(400, "All options must be non-empty");
    }

    // Check if question with same order already exists in the quiz
    const existingQuestion = await Question.findOne({ 
        quiz: quiz.trim(), 
        order: Number(order) 
    });
    if (existingQuestion) {
        throw new ApiError(409, "Question with this order already exists in the quiz");
    }

    // Validate optional fields
    if (points !== undefined && points < 0) {
        throw new ApiError(400, "Points must be a non-negative number");
    }

    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new ApiError(400, "Difficulty must be easy, medium, or hard");
    }

    // Create question
    const question = await Question.create({
        quiz: quiz.trim(),
        questionText: questionText.trim(),
        options: options.map(option => option.trim()),
        correctAnswer: Number(correctAnswer),
        points: points !== undefined ? Number(points) : 1,
        order: Number(order),
        explanation: explanation?.trim() || "",
        difficulty: difficulty || 'medium'
    });

    if (!question) {
        throw new ApiError(500, "Something went wrong while creating the question");
    }

    return res.status(201).json(
        new ApiResponse(201, question, "Question created successfully")
    );
});

// Admin only - Update Question
const updateQuestion = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can update questions");
    }

    const { questionId } = req.params;
    const { quiz, questionText, options, correctAnswer, points, order, explanation, difficulty } = req.body;

    // Validate questionId
    if (!mongoose.isValidObjectId(questionId)) {
        throw new ApiError(400, "Invalid question ID");
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    // Validate fields if provided
    if (quiz && quiz.trim() === "") {
        throw new ApiError(400, "Quiz ID cannot be empty");
    }
    if (questionText && questionText.trim() === "") {
        throw new ApiError(400, "Question text cannot be empty");
    }
    if (order !== undefined && (order === null || order < 1)) {
        throw new ApiError(400, "Order must be a positive number");
    }
    if (correctAnswer !== undefined && (correctAnswer < 0 || correctAnswer > 3)) {
        throw new ApiError(400, "Correct answer must be between 0 and 3");
    }
    if (points !== undefined && points < 0) {
        throw new ApiError(400, "Points must be a non-negative number");
    }
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
        throw new ApiError(400, "Difficulty must be easy, medium, or hard");
    }

    // Validate quiz exists if quiz is being updated
    if (quiz && quiz.trim() !== "") {
        if (!mongoose.isValidObjectId(quiz)) {
            throw new ApiError(400, "Invalid quiz ID");
        }
        const quizExists = await Quiz.findById(quiz);
        if (!quizExists) {
            throw new ApiError(404, "Quiz not found");
        }
    }

    // Validate options if provided
    if (options) {
        if (!Array.isArray(options) || options.length !== 4) {
            throw new ApiError(400, "Exactly 4 options are required");
        }
        if (options.some((option) => !option || option.trim() === "")) {
            throw new ApiError(400, "All options must be non-empty");
        }
    }

    // Check if question with same order already exists in the quiz (if order or quiz is being updated)
    if (order !== undefined || quiz) {
        const quizToCheck = quiz ? quiz.trim() : question.quiz;
        const orderToCheck = order !== undefined ? Number(order) : question.order;
        
        const existingQuestion = await Question.findOne({
            _id: { $ne: questionId },
            quiz: quizToCheck,
            order: orderToCheck
        });
        
        if (existingQuestion) {
            throw new ApiError(409, "Question with this order already exists in the quiz");
        }
    }

    // Update question
    const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        {
            $set: {
                ...(quiz && { quiz: quiz.trim() }),
                ...(questionText && { questionText: questionText.trim() }),
                ...(options && { options: options.map(option => option.trim()) }),
                ...(correctAnswer !== undefined && { correctAnswer: Number(correctAnswer) }),
                ...(points !== undefined && { points: Number(points) }),
                ...(order !== undefined && { order: Number(order) }),
                ...(explanation !== undefined && { explanation: explanation?.trim() || "" }),
                ...(difficulty && { difficulty: difficulty })
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedQuestion, "Question updated successfully")
    );
});

// Admin only - Delete Question
const deleteQuestion = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can delete questions");
    }

    const { questionId } = req.params;

    // Validate questionId
    if (!mongoose.isValidObjectId(questionId)) {
        throw new ApiError(400, "Invalid question ID");
    }

    // Check if question exists and delete
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Question deleted successfully")
    );
});

// Public - Get All Questions for a Quiz
const getAllQuestionsByQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { page = 1, limit = 10, sortBy = "order", sortOrder = "asc" } = req.query;

    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // Check if quiz exists
    const quizExists = await Quiz.findById(quizId);
    if (!quizExists) {
        throw new ApiError(404, "Quiz not found");
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const questions = await Question.find({ quiz: quizId })
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalQuestions = await Question.countDocuments({ quiz: quizId });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalQuestions / limitNumber),
                totalQuestions,
                hasNext: pageNumber < Math.ceil(totalQuestions / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "Questions fetched successfully")
    );
});

// Public - Get Question Details
const getQuestionDetails = asyncHandler(async (req, res) => {
    const { questionId } = req.params;

    // Validate questionId
    if (!mongoose.isValidObjectId(questionId)) {
        throw new ApiError(400, "Invalid question ID");
    }

    const question = await Question.findById(questionId);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    return res.status(200).json(
        new ApiResponse(200, question, "Question details fetched successfully")
    );
});

export {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestionsByQuiz,
    getQuestionDetails
};