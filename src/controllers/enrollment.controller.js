import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// User - Enroll in a Course
const enrollInCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { paymentAmount } = req.body;
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

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
        user: userId,
        course: courseId
    });

    if (existingEnrollment) {
        throw new ApiError(409, "User is already enrolled in this course");
    }

    // Validate payment amount if provided
    if (paymentAmount !== undefined && paymentAmount < 0) {
        throw new ApiError(400, "Payment amount must be non-negative");
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
        user: userId,
        course: courseId,
        paymentAmount: paymentAmount || 0,
        // paymentStatus: paymentAmount && paymentAmount > 0 ? 'completed' : 'pending'
    });

    if (!enrollment) {
        throw new ApiError(500, "Something went wrong while enrolling in the course");
    }

    return res.status(201).json(
        new ApiResponse(201, enrollment, "Successfully enrolled in the course")
    );
});

// User - Get My Enrollments
const getMyEnrollments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, sortBy = "enrolledAt", sortOrder = "desc" } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter = { user: userId };
    if (status && ['active', 'completed', 'dropped'].includes(status)) {
        filter.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const enrollments = await Enrollment.find(filter)
        .populate('course', 'title description thumbnail price category')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalEnrollments = await Enrollment.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            enrollments,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalEnrollments / limitNumber),
                totalEnrollments,
                hasNext: pageNumber < Math.ceil(totalEnrollments / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "Enrollments fetched successfully")
    );
});

// User - Get Specific Enrollment
const getEnrollmentDetails = asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;
    const userId = req.user._id;

    // Validate enrollmentId
    if (!mongoose.isValidObjectId(enrollmentId)) {
        throw new ApiError(400, "Invalid enrollment ID");
    }

    const enrollment = await Enrollment.findOne({
        _id: enrollmentId,
        user: userId
    }).populate('course', 'title description thumbnail price category');

    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    return res.status(200).json(
        new ApiResponse(200, enrollment, "Enrollment details fetched successfully")
    );
});


// User - Update Last Accessed
const updateLastAccessed = asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;
    const userId = req.user._id;

    // Validate enrollmentId
    if (!mongoose.isValidObjectId(enrollmentId)) {
        throw new ApiError(400, "Invalid enrollment ID");
    }

    // Find and update enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
        {
            _id: enrollmentId,
            user: userId
        },
        { $set: { lastAccessedAt: new Date() } },
        { new: true }
    );

    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    return res.status(200).json(
        new ApiResponse(200, enrollment, "Last accessed time updated successfully")
    );
});

// Admin - Get All Enrollments
const getAllEnrollments = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can view all enrollments");
    }

    const { 
        page = 1, 
        limit = 10, 
        status, 
        paymentStatus, 
        courseId, 
        userId,
        sortBy = "enrolledAt", 
        sortOrder = "desc" 
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter object
    const filter = {};
    if (status && ['active', 'completed', 'dropped'].includes(status)) {
        filter.status = status;
    }
    if (paymentStatus && ['pending', 'completed', 'failed'].includes(paymentStatus)) {
        filter.paymentStatus = paymentStatus;
    }
    if (courseId && mongoose.isValidObjectId(courseId)) {
        filter.course = courseId;
    }
    if (userId && mongoose.isValidObjectId(userId)) {
        filter.user = userId;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

    const enrollments = await Enrollment.find(filter)
        .populate('course', 'title description thumbnail price category')
        .populate('user', 'fullName email avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

    const totalEnrollments = await Enrollment.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            enrollments,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(totalEnrollments / limitNumber),
                totalEnrollments,
                hasNext: pageNumber < Math.ceil(totalEnrollments / limitNumber),
                hasPrev: pageNumber > 1
            }
        }, "All enrollments fetched successfully")
    );
});

// Admin - Update Enrollment (including payment status)
const updateEnrollment = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can update enrollments");
    }

    const { enrollmentId } = req.params;
    const { status, paymentStatus, paymentAmount } = req.body;

    // Validate enrollmentId
    if (!mongoose.isValidObjectId(enrollmentId)) {
        throw new ApiError(400, "Invalid enrollment ID");
    }

    // Check if enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    // Validate fields if provided
    if (status && !['active', 'completed', 'dropped'].includes(status)) {
        throw new ApiError(400, "Status must be one of: active, completed, dropped");
    }
    if (paymentStatus && !['pending', 'completed', 'failed'].includes(paymentStatus)) {
        throw new ApiError(400, "Payment status must be one of: pending, completed, failed");
    }
    if (paymentAmount !== undefined && paymentAmount < 0) {
        throw new ApiError(400, "Payment amount must be non-negative");
    }

    // Build update object
    const updateData = {};
    if (status) {
        updateData.status = status;
        if (status === 'completed' && !enrollment.completedAt) {
            updateData.completedAt = new Date();
        }
    }
    if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
    }
    if (paymentAmount !== undefined) {
        updateData.paymentAmount = paymentAmount;
    }

    // Update enrollment
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        { $set: updateData },
        { new: true }
    ).populate('course', 'title description thumbnail price category')
     .populate('user', 'fullName email avatar');

    return res.status(200).json(
        new ApiResponse(200, updatedEnrollment, "Enrollment updated successfully")
    );
});

// Admin - Delete Enrollment
const deleteEnrollment = asyncHandler(async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admin can delete enrollments");
    }

    const { enrollmentId } = req.params;

    // Validate enrollmentId
    if (!mongoose.isValidObjectId(enrollmentId)) {
        throw new ApiError(400, "Invalid enrollment ID");
    }

    // Check if enrollment exists and delete
    const enrollment = await Enrollment.findByIdAndDelete(enrollmentId);
    if (!enrollment) {
        throw new ApiError(404, "Enrollment not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Enrollment deleted successfully")
    );
});

// Public - Get Course Enrollment Statistics
const getCourseEnrollmentStats = asyncHandler(async (req, res) => {
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

    // Get enrollment statistics
    const stats = await Enrollment.aggregate([
        { $match: { course: courseId } },
        {
            $group: {
                _id: null,
                totalEnrollments: { $sum: 1 },
                activeEnrollments: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                completedEnrollments: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                },
                droppedEnrollments: {
                    $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] }
                },
                totalRevenue: { $sum: "$paymentAmount" },
                completedPayments: {
                    $sum: { $cond: [{ $eq: ["$paymentStatus", "completed"] }, 1, 0] }
                }
            }
        }
    ]);

    const result = stats.length > 0 ? stats[0] : {
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        droppedEnrollments: 0,
        totalRevenue: 0,
        completedPayments: 0
    };

    return res.status(200).json(
        new ApiResponse(200, result, "Course enrollment statistics fetched successfully")
    );
});

export {
    enrollInCourse,
    getMyEnrollments,
    getEnrollmentDetails,
    updateLastAccessed,
    getAllEnrollments,
    updateEnrollment,
    deleteEnrollment,
    getCourseEnrollmentStats
};