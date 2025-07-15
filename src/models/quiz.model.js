import mongoose, {Schema} from "mongoose";

const quizSchema = new Schema({
  course: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30,
    min: 1
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true,
    min: 1
  }
}, { timestamps: true });


export const Quiz = mongoose.model("Quiz", quizSchema);