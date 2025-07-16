import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { QuizAttempt } from "../models/quizAttempt.js";
import { Quiz } from "../models/quiz.model.js";
import { Question } from "../models/question.model.js";
import { Progress } from "../models/progress.model.js";
import { Course } from "../models/course.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// User - Start a Quiz Attempt
const startQuizAttempt = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user._id;

    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Get course information
    const course = await Course.findById(quiz.course);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Check if user has reached max attempts
    const attemptCount = await QuizAttempt.countAttempts(userId, quizId);
    if (quiz.maxAttempts > 0 && attemptCount >= quiz.maxAttempts) {
        throw new ApiError(400, "Maximum attempts reached for this quiz");
    }

    // Create a new attempt
    const attempt = await QuizAttempt.create({
        user: userId,
        quiz: quizId,
        course: quiz.course,
        answers: [],
        score: 0,
        maxScore: 0, // Will be calculated when submitting
        percentage: 0,
        passed: false,
        attemptNumber: attemptCount + 1,
        startedAt: new Date(),
        timeTaken: 0
    });

    return res.status(201).json(
        new ApiResponse(201, {
            attemptId: attempt._id,
            quizDetails: {
                title: quiz.title,
                description: quiz.description,
                timeLimit: quiz.timeLimit,
                attemptNumber: attempt.attemptNumber,
                maxAttempts: quiz.maxAttempts,
                startedAt: attempt.startedAt
            }
        }, "Quiz attempt started successfully")
    );
});

// User - Submit Quiz Attempt
const submitQuizAttempt = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    // Validate attemptId
    if (!mongoose.isValidObjectId(attemptId)) {
        throw new ApiError(400, "Invalid attempt ID");
    }

    // Validate answers format
    if (!Array.isArray(answers)) {
        throw new ApiError(400, "Answers must be an array");
    }

    // Check if attempt exists and belongs to user
    const attempt = await QuizAttempt.findOne({
        _id: attemptId,
        user: userId
    });

    if (!attempt) {
        throw new ApiError(404, "Quiz attempt not found");
    }

    // Check if attempt is already submitted
    if (attempt.submittedAt && attempt.answers.length > 0) {
        throw new ApiError(400, "Quiz attempt already submitted");
    }

    // Get quiz details
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Check if time limit exceeded
    const now = new Date();
    const timeTakenSeconds = Math.round((now - attempt.startedAt) / 1000);
    const timeLimitSeconds = quiz.timeLimit * 60;
    
    if (timeLimitSeconds > 0 && timeTakenSeconds > timeLimitSeconds) {
        throw new ApiError(400, "Time limit exceeded");
    }

    // Fetch all questions for this quiz
    const questions = await Question.find({ quiz: attempt.quiz }).sort({ order: 1 });
    if (questions.length === 0) {
        throw new ApiError(404, "No questions found for this quiz");
    }

    // Build question map for quick lookup
    const questionMap = new Map();
    let maxPossibleScore = 0;
    
    questions.forEach(question => {
        questionMap.set(question._id.toString(), question);
        maxPossibleScore += question.points || 1;
    });

    // Process and validate answers
    const processedAnswers = [];
    let totalScore = 0;

    for (const answer of answers) {
        // Validate answer format
        if (!answer.question || answer.selectedOption === undefined) {
            throw new ApiError(400, "Invalid answer format");
        }

        if (!mongoose.isValidObjectId(answer.question)) {
            throw new ApiError(400, `Invalid question ID: ${answer.question}`);
        }

        const question = questionMap.get(answer.question);
        if (!question) {
            throw new ApiError(400, `Question not found in this quiz: ${answer.question}`);
        }

        if (answer.selectedOption < 0 || answer.selectedOption > 3) {
            throw new ApiError(400, "Selected option must be between 0 and 3");
        }

        // Check if answer is correct
        const isCorrect = answer.selectedOption === question.correctAnswer;
        const points = isCorrect ? (question.points || 1) : 0;
        totalScore += points;

        // Add to processed answers
        processedAnswers.push({
            question: answer.question,
            selectedOption: answer.selectedOption,
            isCorrect,
            points
        });
    }

    // Calculate percentage and check if passed
    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = percentage >= quiz.passingScore;

    // Update attempt with answers and results
    attempt.answers = processedAnswers;
    attempt.score = totalScore;
    attempt.maxScore = maxPossibleScore;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.submittedAt = now;
    attempt.timeTaken = timeTakenSeconds;

    await attempt.save();

    // If passed, update user's progress
    if (passed) {
        const progress = await Progress.findOne({
            user: userId,
            course: attempt.course
        });

        if (progress) {
            const updatedPassedQuizzes = Math.max(progress.passedQuizzes, progress.passedQuizzes + 1);
            progress.passedQuizzes = updatedPassedQuizzes;
            progress.calculateCompletion();
            await progress.save();
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {
            attemptId: attempt._id,
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage: attempt.percentage,
            passed: attempt.passed,
            timeTaken: attempt.timeTaken,
            answers: attempt.answers,
            submittedAt: attempt.submittedAt
        }, "Quiz attempt submitted successfully")
    );
});

// User - Get My Quiz Attempts
const getMyQuizAttempts = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const userId = req.user._id;
    
    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Get all attempts for this quiz by the user
    const attempts = await QuizAttempt.find({
        user: userId,
        quiz: quizId
    }).sort({ attemptNumber: -1 });

    // Get summary stats
    const bestAttempt = await QuizAttempt.getBestAttempt(userId, quizId);
    const attemptCount = attempts.length;
    const hasPassed = attempts.some(attempt => attempt.passed);

    return res.status(200).json(
        new ApiResponse(200, {
            attempts,
            summary: {
                totalAttempts: attemptCount,
                maxAttempts: quiz.maxAttempts,
                attemptsRemaining: Math.max(0, quiz.maxAttempts - attemptCount),
                hasPassed,
                bestScore: bestAttempt ? bestAttempt.score : 0,
                bestPercentage: bestAttempt ? bestAttempt.percentage : 0
            }
        }, "Quiz attempts fetched successfully")
    );
});

// User - Get Specific Quiz Attempt
const getQuizAttemptDetails = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const userId = req.user._id;

    // Validate attemptId
    if (!mongoose.isValidObjectId(attemptId)) {
        throw new ApiError(400, "Invalid attempt ID");
    }

    // Find attempt
    const attempt = await QuizAttempt.findOne({
        _id: attemptId,
        user: userId
    });

    if (!attempt) {
        throw new ApiError(404, "Quiz attempt not found");
    }

    // Get quiz details
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // If attempt is submitted, include detailed results
    let result = {
        attemptId: attempt._id,
        quiz: {
            id: attempt.quiz,
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore
        },
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeTaken: attempt.timeTaken
    };

    if (attempt.submittedAt) {
        // Get questions to include explanations for incorrect answers
        const questions = await Question.find({
            quiz: attempt.quiz,
            _id: { $in: attempt.answers.map(a => a.question) }
        });

        const questionMap = new Map();
        questions.forEach(q => questionMap.set(q._id.toString(), q));

        const detailedAnswers = attempt.answers.map(answer => ({
            question: answer.question,
            questionText: questionMap.get(answer.question.toString())?.questionText || "Question not found",
            selectedOption: answer.selectedOption,
            correctOption: questionMap.get(answer.question.toString())?.correctAnswer,
            isCorrect: answer.isCorrect,
            points: answer.points,
            explanation: !answer.isCorrect ? questionMap.get(answer.question.toString())?.explanation : undefined
        }));

        result = {
            ...result,
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage: attempt.percentage,
            passed: attempt.passed,
            answers: detailedAnswers
        };
    }

    return res.status(200).json(
        new ApiResponse(200, result, "Quiz attempt details fetched successfully")
    );
});

// Admin - Get All Quiz Attempts
const getAllQuizAttempts = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can view all quiz attempts");
    }

    const { 
        page = 1, 
        limit = 10, 
        quizId, 
        userId, 
        courseId,
        passed,
        sortBy = "createdAt", 
        sortOrder = "desc" 
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter = {};
    if (quizId && mongoose.isValidObjectId(quizId)) {
        filter.quiz = quizId;
    }
    if (userId && mongoose.isValidObjectId(userId)) {
        filter.user = userId;
    }
    if (courseId && mongoose.isValidObjectId(courseId)) {
        filter.course = courseId;
    }
    if (passed !== undefined) {
        filter.passed = passed === 'true';
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const attempts = await QuizAttempt.find(filter)
        .populate('user', 'fullName email')
        .populate('quiz', 'title description')
        .populate('course', 'title')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalAttempts = await QuizAttempt.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            attempts,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalAttempts / limitNumber),
                totalAttempts,
                hasNext: pageNumber < Math.ceil(totalAttempts / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "All quiz attempts fetched successfully")
    );
});

// Admin - Get Quiz Attempt Statistics
const getQuizAttemptStats = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can view quiz attempt statistics");
    }

    const { quizId } = req.params;

    // Validate quizId
    if (!mongoose.isValidObjectId(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    // Get statistics
    const stats = await QuizAttempt.aggregate([
        { $match: { quiz: quizId } },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                uniqueUsers: { $addToSet: "$user" },
                passedAttempts: {
                    $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] }
                },
                averageScore: { $avg: "$score" },
                averagePercentage: { $avg: "$percentage" },
                averageTimeTaken: { $avg: "$timeTaken" },
                highestScore: { $max: "$score" },
                lowestScore: { $min: "$score" }
            }
        },
        {
            $project: {
                _id: 0,
                totalAttempts: 1,
                uniqueUsers: { $size: "$uniqueUsers" },
                passedAttempts: 1,
                passRate: {
                    $cond: [
                        { $eq: ["$totalAttempts", 0] },
                        0,
                        { $multiply: [{ $divide: ["$passedAttempts", "$totalAttempts"] }, 100] }
                    ]
                },
                averageScore: 1,
                averagePercentage: 1,
                averageTimeTaken: 1,
                highestScore: 1,
                lowestScore: 1
            }
        }
    ]);

    const result = stats.length > 0 ? stats[0] : {
        totalAttempts: 0,
        uniqueUsers: 0,
        passedAttempts: 0,
        passRate: 0,
        averageScore: 0,
        averagePercentage: 0,
        averageTimeTaken: 0,
        highestScore: 0,
        lowestScore: 0
    };

    // Get most common incorrect answers
    const questionStats = await QuizAttempt.aggregate([
        { $match: { quiz: quizId } },
        { $unwind: "$answers" },
        {
            $group: {
                _id: "$answers.question",
                totalAnswers: { $sum: 1 },
                correctAnswers: {
                    $sum: { $cond: [{ $eq: ["$answers.isCorrect", true] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 1,
                totalAnswers: 1,
                correctAnswers: 1,
                incorrectAnswers: { $subtract: ["$totalAnswers", "$correctAnswers"] },
                correctPercentage: {
                    $cond: [
                        { $eq: ["$totalAnswers", 0] },
                        0,
                        { $multiply: [{ $divide: ["$correctAnswers", "$totalAnswers"] }, 100] }
                    ]
                }
            }
        },
        { $sort: { correctPercentage: 1 } },
        { $limit: 5 }
    ]);

    // Fetch question details
    const questionIds = questionStats.map(q => q._id);
    const questions = await Question.find({ _id: { $in: questionIds } });
    
    const questionMap = new Map();
    questions.forEach(q => questionMap.set(q._id.toString(), q));

    const questionDetails = questionStats.map(stat => ({
        questionId: stat._id,
        questionText: questionMap.get(stat._id.toString())?.questionText || "Question not found",
        totalAnswers: stat.totalAnswers,
        correctAnswers: stat.correctAnswers,
        incorrectAnswers: stat.incorrectAnswers,
        correctPercentage: Math.round(stat.correctPercentage)
    }));

    return res.status(200).json(
        new ApiResponse(200, {
            ...result,
            passRate: Math.round(result.passRate),
            averagePercentage: Math.round(result.averagePercentage),
            averageTimeTaken: Math.round(result.averageTimeTaken),
            difficultQuestions: questionDetails
        }, "Quiz attempt statistics fetched successfully")
    );
});

// Admin - Delete Quiz Attempt
const deleteQuizAttempt = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can delete quiz attempts");
    }

    const { attemptId } = req.params;

    // Validate attemptId
    if (!mongoose.isValidObjectId(attemptId)) {
        throw new ApiError(400, "Invalid attempt ID");
    }

    // Check if attempt exists and delete
    const attempt = await QuizAttempt.findByIdAndDelete(attemptId);
    if (!attempt) {
        throw new ApiError(404, "Quiz attempt not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Quiz attempt deleted successfully")
    );
});

export {
    startQuizAttempt,
    submitQuizAttempt,
    getMyQuizAttempts,
    getQuizAttemptDetails,
    getAllQuizAttempts,
    getQuizAttemptStats,
    deleteQuizAttempt
};