const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  fileName: String,
  resumeText: String,
  extractedInfo: {
    skills: [String],
    experienceSummary: String,
    education: String,
    name: String,
    contact: String,
  },
  fitScore: Number,
  fitJustification: String,
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Applicant', applicantSchema);
