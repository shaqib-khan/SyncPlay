const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

// POST /api/auth/register
const register = [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username: letters, numbers, underscores only'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    try {
      const { username, email, password } = req.body
      const user = await User.create({ username, email, password })
      const token = signToken(user._id)
      res.status(201).json({ token, user: user.toPublicJSON() })
    } catch (err) {
      next(err)
    }
  },
]

// POST /api/auth/login
const login = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    try {
      const { email, password } = req.body
      const user = await User.findOne({ email }).select('+password')
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password.' })
      }
      const token = signToken(user._id)
      res.json({ token, user: user.toPublicJSON() })
    } catch (err) {
      next(err)
    }
  },
]

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user.toPublicJSON() })
}

module.exports = { register, login, getMe }

