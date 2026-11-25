import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Tv2 } from 'lucide-react'

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-primary text-center px-4">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
      <div className="text-8xl font-black gradient-text mb-4">404</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h1>
      <p className="text-text-secondary mb-8">The page you're looking for doesn't exist or has been removed.</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
        <Home size={18} />
        Back to Home
      </Link>
    </motion.div>
  </div>
)

export default NotFound

