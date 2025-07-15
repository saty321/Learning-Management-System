import mongoose, {Schema} from "mongoose";

const quizAttemptSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  quiz: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  answers: [{
    question: {
      type: String,
      required: true
    },
    selectedOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  passed: {
    type: Boolean,
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  timeTaken: {
    type: Number, // in seconds
    required: true,
    min: 0
  }
}, { timestamps: true });


// Pre-save middleware to calculate percentage and passed status
quizAttemptSchema.pre('save', function(next) {
  if (this.maxScore > 0) {
    this.percentage = Math.round((this.score / this.maxScore) * 100);
  } else {
    this.percentage = 0;
  }
  
  // This will be set based on quiz's passing score in the controller
  // this.passed = this.percentage >= quiz.passingScore;
  
  next();
});

// Method to get user's best attempt for a quiz
quizAttemptSchema.statics.getBestAttempt = function(userId, quizId) {
  return this.findOne({
    user: userId,
    quiz: quizId
  }).sort({ score: -1, submittedAt: -1 });
};

// Method to get user's latest attempt for a quiz
quizAttemptSchema.statics.getLatestAttempt = function(userId, quizId) {
  return this.findOne({
    user: userId,
    quiz: quizId
  }).sort({ attemptNumber: -1 });
};

// Method to count user's attempts for a quiz
quizAttemptSchema.statics.countAttempts = function(userId, quizId) {
  return this.countDocuments({
    user: userId,
    quiz: quizId
  });
};

export const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);