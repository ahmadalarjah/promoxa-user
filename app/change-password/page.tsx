"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const result = await apiService.changePassword(formData.oldPassword, formData.newPassword)
      
      if (result.success) {
        setSuccess("Password changed successfully!")
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" })
        
        // Redirect to profile page after 2 seconds
        setTimeout(() => {
          router.push("/profile")
        }, 2000)
      } else {
        setError(result.error || "Failed to change password. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <Card className="bg-card-custom border-golden/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/profile" className="inline-flex items-center text-golden hover:text-golden/80 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-golden mb-2">Change Password</h1>
          <p className="text-gray-400">Update your account password</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 mb-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-500 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showOldPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-golden"
              >
                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-golden"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Must be at least 6 characters long</p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-golden"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-golden hover:bg-golden/90 text-black font-semibold"
            disabled={isLoading}
          >
            {isLoading ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
