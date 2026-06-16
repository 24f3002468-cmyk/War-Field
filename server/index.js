require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const rateLimit = require('express-rate-limit')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true }))

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

const { initSchema } = require('./db/schema')

initSchema().then(() => {
  app.use('/api/auth',         require('./routes/auth'))
  app.use('/api/dsa',          require('./routes/dsa'))
  app.use('/api/applications', require('./routes/applications'))
  app.use('/api/logs',         require('./routes/logs'))
  const misc = require('./routes/misc')
  app.use('/api/projects',     misc.projectsRouter)
  app.use('/api/goals',        misc.goalsRouter)
  app.use('/api/timers',       misc.timersRouter)
  app.use('/api/audit',        misc.auditRouter)
  app.use('/api/network',      misc.networkRouter)

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')))
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')))
  }

  app.use((err, req, res, next) => {
    console.error('Server error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  })

  app.listen(PORT, () => {
    console.log(`\n🚀 ExecOS running on port ${PORT}`)
    console.log(`   DB: ${process.env.DATABASE_URL ? 'PostgreSQL ✓' : 'NOT SET ✗'}`)
    console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})
