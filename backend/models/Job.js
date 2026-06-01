const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  extractedInfo: {
    requiredSkills: [String],
    experienceSummary: String,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyName: String,
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Job', jobSchema);
