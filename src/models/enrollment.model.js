import mongoose, {Schema} from "mongoose";

const enrollmentSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  },
  completedAt: {
    type: Date
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    min: 0
  }
}, { timestamps: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);