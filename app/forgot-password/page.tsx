"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft } from "lucide-react"
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsLoading(false)
    setIsSent(true)
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-golden mb-2">PROMOXA</h1>
                     <p className="text-gray-400">Reset Password</p>
        </div>

                 <Card className="bg-card-custom border-golden/20 p-8 rounded-2xl shadow-xl">
          {!isSent ? (
            <>
                             <div className="mb-6">
                 <p className="text-gray-300 text-base mb-4 text-center">
                   Enter your email to send verification code
                 </p>
               </div>

                             <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-3">
                   <Label htmlFor="email" className="text-white text-sm font-medium">
                     Email
                   </Label>
                   <div className="relative">
                     <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                     <Input
                       id="email"
                       type="email"
                       placeholder="Enter your email"
                       className="pl-12 pr-4 py-3 bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-400 rounded-xl"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       required
                     />
                   </div>
                 </div>

                                 <Button 
                   type="submit" 
                   className="w-full bg-golden hover:bg-golden/90 text-black font-semibold py-3 rounded-xl text-base"
                   disabled={isLoading || !email.trim()}
                 >
                   {isLoading ? 'Sending...' : 'Send Verification Code'}
                 </Button>
              </form>
            </>
          ) : (
                         <div className="text-center py-4">
               <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Mail className="w-10 h-10 text-success" />
               </div>
               <h3 className="text-white font-semibold mb-3 text-xl">Sent Successfully!</h3>
                                <p className="text-gray-400 text-base mb-8 leading-relaxed">
                   Verification code has been sent to your email
                 </p>
               <Button 
                 onClick={() => {
                   setIsSent(false)
                   setEmail("")
                 }}
                 className="w-full bg-golden hover:bg-golden/90 text-black font-semibold py-3 rounded-xl text-base"
               >
                 Try Again
               </Button>
             </div>
          )}

                     <div className="text-center mt-8 pt-6 border-t border-gray-700/50">
             <Link href="/login" className="text-golden hover:text-golden/80 text-sm flex items-center justify-center gap-2">
               <ArrowLeft className="w-4 h-4" />
               Back to Login
             </Link>
           </div>
        </Card>

                 {/* Info Card */}
         <Card className="bg-card-custom border-golden/20 p-6 mt-6 rounded-2xl shadow-lg">
                     <h3 className="text-golden font-semibold mb-4 text-lg">Important Information</h3>
           <div className="space-y-3 text-sm text-gray-300">
                         <div className="flex items-start gap-3">
               <div className="w-2 h-2 bg-golden rounded-full mt-2.5 flex-shrink-0"></div>
               <p className="leading-relaxed">Make sure to enter the email registered in your account</p>
             </div>
             <div className="flex items-start gap-3">
               <div className="w-2 h-2 bg-golden rounded-full mt-2.5 flex-shrink-0"></div>
               <p className="leading-relaxed">Verification code is valid for 10 minutes only</p>
             </div>
             <div className="flex items-start gap-3">
               <div className="w-2 h-2 bg-golden rounded-full mt-2.5 flex-shrink-0"></div>
               <p className="leading-relaxed">If you did not receive the code, check your spam folder</p>
             </div>
             <div className="flex items-start gap-3">
               <div className="w-2 h-2 bg-golden rounded-full mt-2.5 flex-shrink-0"></div>
               <p className="leading-relaxed">For additional help, contact technical support</p>
             </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
