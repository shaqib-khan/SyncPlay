const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`)
  err.statusCode = 404
  next(err)
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({
      error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ error: messages.join('. ') })
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err)
    return res.status(statusCode).json({ error: err.message, stack: err.stack })
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
  })
}

module.exports = { notFound, errorHandler }

