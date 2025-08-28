"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
export default function RegisterPage() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    referralCode: "",
    password: "",
    confirmPassword: "",
    walletAddress: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const result = await register(formData)
      if (!result.success) {
        setError(result.message || 'Registration failed. Please try again.')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <Card className="bg-card-custom border-golden/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-golden mb-2">PROMOXA</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Username
            </label>
            <Input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Phone
            </label>
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Referral Code
            </label>
            <Input
              type="text"
              placeholder="Enter referral code"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Wallet Address
            </label>
            <Input
              type="text"
              placeholder="Enter your wallet address"
              value={formData.walletAddress}
              onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
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

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-golden hover:text-golden/80">
              Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
