import mongoose, {Schema} from "mongoose";

const questionSchema = new Schema({
  quiz: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  explanation: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
}, { timestamps: true });

// Validate options array length
questionSchema.pre('save', function(next) {
  if (this.options.length !== 4) {
    return next(new Error('Each question must have exactly 4 options'));
  }
  if (this.correctAnswer >= this.options.length) {
    return next(new Error('Correct answer index must be within options range'));
  }
  next();
});

export const Question = mongoose.model("Question", questionSchema);