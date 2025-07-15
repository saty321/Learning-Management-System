import mongoose, {Schema} from "mongoose";

const lessonSchema = new Schema({
  course: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  videoUrl: {
    type: String,
    required: true,
    trim: true
  },
  resourceLinks: [{
    type: String,
    trim: true
  }],
  order: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const Lesson = mongoose.model("Lesson", lessonSchema);