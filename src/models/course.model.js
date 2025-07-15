import mongoose, {Schema} from "mongoose";

const courseSchema = new Schema({
  user: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  instructorName: {
    type: String,
    required: false,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
}, { timestamps: true });

export const Course = mongoose.model("Course", courseSchema);