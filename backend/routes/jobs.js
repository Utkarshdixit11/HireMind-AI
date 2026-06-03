const express = require('express');
const Job = require('../models/Job');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET all jobs (public)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'active' })
      .populate('postedBy', 'name companyName avatar')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name companyName avatar');
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST create job (protected - providers only)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, extractedInfo } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const job = await Job.create({
      title,
      description,
      extractedInfo: extractedInfo || { requiredSkills: [], experienceSummary: '' },
      postedBy: req.userId,
      companyName: req.user.companyName || req.user.name,
    });

    res.status(201).json({ message: 'Job posted successfully.', job });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET jobs by current user (provider)
router.get('/user/mine', protect, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.userId }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE job (mark as closed)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (job.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    job.status = 'closed';
    await job.save();
    res.json({ message: 'Job marked as closed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
