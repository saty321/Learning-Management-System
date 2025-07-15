import mongoose, {Schema} from "mongoose";

const progressSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  completedLessons: [{
    lesson: {
      type: String,
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  totalQuizzes: {
    type: Number,
    default: 0
  },
  passedQuizzes: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


// Method to calculate completion percentage
progressSchema.methods.calculateCompletion = function() {
  const totalItems = this.totalLessons + this.totalQuizzes;
  const completedItems = this.completedLessons.length + this.passedQuizzes;
  
  if (totalItems === 0) {
    this.completionPercentage = 0;
  } else {
    this.completionPercentage = Math.round((completedItems / totalItems) * 100);
  }
  
  return this.completionPercentage;
};

// Method to mark lesson as completed
progressSchema.methods.markLessonCompleted = function(lessonId) {
  const alreadyCompleted = this.completedLessons.some(
    cl => cl.lesson.toString() === lessonId.toString()
  );
  
  if (!alreadyCompleted) {
    this.completedLessons.push({
      lesson: lessonId,
      completedAt: new Date()
    });
    this.calculateCompletion();
  }
};

export const Progress = mongoose.model("Progress", progressSchema);