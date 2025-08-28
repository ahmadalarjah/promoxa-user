"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    usernameOrPhone: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDemoMode, setIsDemoMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await login(formData.usernameOrPhone, formData.password)
      
      if (!result.success) {
        setError(result.message || 'Login failed. Please try again.')
        
        // If backend is not available, offer demo mode
        if (result.message?.includes('Backend server is not available')) {
          setIsDemoMode(true)
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    // Create a demo user and store in localStorage
    const demoUser = {
      id: 1,
      username: "demo_user",
      fullName: "مستخدم تجريبي",
      phoneNumber: "+966500000000",
      email: "demo@promoxa.com",
      referralCode: "DEMO123",
      currentPlan: {
        id: 1,
        name: "الخطة الذهبية",
        price: 500,
        minDailyEarning: 15,
        maxDailyEarning: 25
      },
      walletAddress: "TRC20_DEMO_ADDRESS_HERE",
      totalBalance: 1250.50,
      referralEarnings: 245.75,
      dailyEarnings: 18.50,
      totalEarnings: 1564.25
    }
    
    localStorage.setItem('demo_user', JSON.stringify(demoUser))
    localStorage.setItem('demo_mode', 'true')
    
    // Redirect to home page
    window.location.href = '/home'
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <Card className="bg-card-custom border-golden/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-golden mb-2">PROMOXA</h1>
          <p className="text-gray-400">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Username or Phone
            </label>
            <Input
              type="text"
              placeholder="Enter your username or phone"
              value={formData.usernameOrPhone}
              onChange={(e) => setFormData({ ...formData, usernameOrPhone: e.target.value })}
              className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-golden hover:bg-golden/90 text-black font-semibold h-12"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Demo Mode Option */}
        {isDemoMode && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">Demo Mode</h3>
            <p className="text-blue-300 text-sm mb-3">
              Backend server is not available. You can try the demo mode to explore the app.
            </p>
            <Button
              onClick={handleDemoLogin}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Try Demo
            </Button>
          </div>
        )}

        <div className="mt-6 text-center space-y-3">
          <Link href="/forgot-password" className="block text-golden hover:text-golden/80 text-sm">
            Forgot Password?
          </Link>
          <div className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-golden hover:text-golden/80">
              Create Account
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
