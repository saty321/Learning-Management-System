import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Progress } from "../models/progress.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// User - Get Course Progress
const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // Validate courseId
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const progress = await Progress.findOne({
    user: userId,
    course: courseId
  });

  if (!progress) {
    throw new ApiError(404, "Progress not found for this course");
  }

  return res.status(200).json(
    new ApiResponse(200, progress, "Course progress fetched successfully")
  );
});

// User - Get My Progress
const getUserProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, sortBy = "updatedAt", sortOrder = "desc" } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

  const progressList = await Progress.find({
    user: userId
  })
    .populate('course', 'title description thumbnail price category')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNumber);

  const totalProgress = await Progress.countDocuments({ user: userId });

  return res.status(200).json(
    new ApiResponse(200, {
      progress: progressList,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProgress / limitNumber),
        totalProgress,
        hasNext: pageNumber < Math.ceil(totalProgress / limitNumber),
        hasPrev: pageNumber > 1
      }
    }, "User progress fetched successfully")
  );
});

// User - Create or Update Progress
const createOrUpdateProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const { totalLessons, totalQuizzes } = req.body;

  // Validate courseId
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Validate input
  if (totalLessons !== undefined && totalLessons < 0) {
    throw new ApiError(400, "Total lessons must be non-negative");
  }
  if (totalQuizzes !== undefined && totalQuizzes < 0) {
    throw new ApiError(400, "Total quizzes must be non-negative");
  }

  let progress = await Progress.findOne({
    user: userId,
    course: courseId
  });

  if (progress) {
    // Update existing progress
    if (totalLessons !== undefined) progress.totalLessons = totalLessons;
    if (totalQuizzes !== undefined) progress.totalQuizzes = totalQuizzes;
    
    progress.lastAccessedAt = new Date();
    progress.calculateCompletion();
    
    await progress.save();
  } else {
    // Create new progress
    progress = await Progress.create({
      user: userId,
      course: courseId,
      totalLessons: totalLessons || 0,
      totalQuizzes: totalQuizzes || 0,
      lastAccessedAt: new Date()
    });
  }

  if (!progress) {
    throw new ApiError(500, "Something went wrong while creating/updating progress");
  }

  return res.status(201).json(
    new ApiResponse(201, progress, "Progress created/updated successfully")
  );
});

// User - Mark Lesson as Completed
const markLessonCompleted = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const userId = req.user._id;

  // Validate courseId and lessonId
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }
  if (!mongoose.isValidObjectId(lessonId)) {
    throw new ApiError(400, "Invalid lesson ID");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  let progress = await Progress.findOne({
    user: userId,
    course: courseId
  });

  if (!progress) {
    throw new ApiError(404, "Progress not found for this course");
  }

  // Check if lesson is already completed
  const alreadyCompleted = progress.completedLessons.some(
    cl => cl.lesson.toString() === lessonId.toString()
  );

  if (alreadyCompleted) {
    return res.status(200).json(
      new ApiResponse(200, progress, "Lesson already completed")
    );
  }

  // Mark lesson as completed using the schema method
  progress.markLessonCompleted(lessonId);
  progress.lastAccessedAt = new Date();
  
  await progress.save();

  return res.status(200).json(
    new ApiResponse(200, progress, "Lesson marked as completed successfully")
  );
});

// User - Update Quiz Progress
const updateQuizProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  const { passedQuizzes } = req.body;

  // Validate courseId
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // Validate passedQuizzes
  if (passedQuizzes === undefined) {
    throw new ApiError(400, "passedQuizzes is required");
  }
  if (passedQuizzes < 0) {
    throw new ApiError(400, "Passed quizzes must be non-negative");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  let progress = await Progress.findOne({
    user: userId,
    course: courseId
  });

  if (!progress) {
    throw new ApiError(404, "Progress not found for this course");
  }

  // Validate that passed quizzes doesn't exceed total quizzes
  if (passedQuizzes > progress.totalQuizzes) {
    throw new ApiError(400, "Passed quizzes cannot exceed total quizzes");
  }

  progress.passedQuizzes = passedQuizzes;
  progress.lastAccessedAt = new Date();
  progress.calculateCompletion();

  await progress.save();

  return res.status(200).json(
    new ApiResponse(200, progress, "Quiz progress updated successfully")
  );
});

// User - Reset Course Progress
const resetCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // Validate courseId
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const progress = await Progress.findOne({
    user: userId,
    course: courseId
  });

  if (!progress) {
    throw new ApiError(404, "Progress not found for this course");
  }

  progress.completedLessons = [];
  progress.passedQuizzes = 0;
  progress.completionPercentage = 0;
  progress.lastAccessedAt = new Date();

  await progress.save();

  return res.status(200).json(
    new ApiResponse(200, progress, "Course progress reset successfully")
  );
});

// Public - Get Course Progress Statistics
const getCourseProgressStats = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Validate courseId
  if (!mongoose.isValidObjectId(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const stats = await Progress.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        averageCompletion: { $avg: "$completionPercentage" },
        completedStudents: {
          $sum: {
            $cond: [{ $eq: ["$completionPercentage", 100] }, 1, 0]
          }
        },
        activeStudents: {
          $sum: {
            $cond: [
              {
                $gte: [
                  "$lastAccessedAt",
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
                ]
              },
              1,
              0
            ]
          }
        },
        averageLessonsCompleted: { $avg: { $size: "$completedLessons" } },
        averageQuizzesPassed: { $avg: "$passedQuizzes" }
      }
    }
  ]);

  const result = stats.length > 0 ? stats[0] : {
    totalStudents: 0,
    averageCompletion: 0,
    completedStudents: 0,
    activeStudents: 0,
    averageLessonsCompleted: 0,
    averageQuizzesPassed: 0
  };

  return res.status(200).json(
    new ApiResponse(200, result, "Course progress statistics fetched successfully")
  );
});

// Admin - Get All Progress
const getAllProgress = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can view all progress");
  }

  const { 
    page = 1, 
    limit = 10, 
    courseId, 
    userId,
    sortBy = "updatedAt", 
    sortOrder = "desc" 
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Build filter object
  const filter = {};
  if (courseId && mongoose.isValidObjectId(courseId)) {
    filter.course = courseId;
  }
  if (userId && mongoose.isValidObjectId(userId)) {
    filter.user = userId;
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

  const progressList = await Progress.find(filter)
    .populate('course', 'title description thumbnail price category')
    .populate('user', 'fullName email avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(limitNumber);

  const totalProgress = await Progress.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(200, {
      progress: progressList,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProgress / limitNumber),
        totalProgress,
        hasNext: pageNumber < Math.ceil(totalProgress / limitNumber),
        hasPrev: pageNumber > 1
      }
    }, "All progress fetched successfully")
  );
});

// Admin - Delete Progress
const deleteProgress = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Only admin can delete progress");
  }

  const { progressId } = req.params;

  // Validate progressId
  if (!mongoose.isValidObjectId(progressId)) {
    throw new ApiError(400, "Invalid progress ID");
  }

  // Check if progress exists and delete
  const progress = await Progress.findByIdAndDelete(progressId);
  if (!progress) {
    throw new ApiError(404, "Progress not found");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Progress deleted successfully")
  );
});

export {
  getCourseProgress,
  getUserProgress,
  createOrUpdateProgress,
  markLessonCompleted,
  updateQuizProgress,
  resetCourseProgress,
  getCourseProgressStats,
  getAllProgress,
  deleteProgress
};