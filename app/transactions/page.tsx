"use client"

import { useState } from "react"
import { ArrowRight, Clock, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { NavigationHeader } from "@/components/navigation-header"

export default function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState("today")

  const transactions = [
    {
      amount: "USDT 2.3+",
      description: "المساهمة في حملة تسويق لمنتج جديد",
      time: "PM 7:12",
      type: "earning",
    },
    {
      amount: "USDT 1.9+",
      description: "الترويج لمشروع بيئي",
      time: "PM 7:25",
      type: "earning",
    },
    {
      amount: "USDT 3.1+",
      description: "إتمام طلب لدعم منصة تجارية",
      time: "PM 8:45",
      type: "earning",
    },
    {
      amount: "USDT 2.7+",
      description: "المساهمة في حملة ترويجية لتطبيق جديد",
      time: "PM 9:15",
      type: "earning",
    },
    {
      amount: "USDT 4.2+",
      description: "دعم مشروع تقني ناشئ",
      time: "PM 10:30",
      type: "earning",
    },
  ]

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Navigation Header */}
      <NavigationHeader 
        title="المعاملات"
        onBack={() => window.history.back()}
      />
      
      <div className="p-4 space-y-6">
        {/* Filter Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setActiveFilter("today")}
            className={`px-6 py-2 rounded-xl font-semibold ${
              activeFilter === "today"
                ? "bg-golden text-black hover:bg-golden/90"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] border border-gray-600"
            }`}
          >
            اليوم
          </Button>
          <Button
            onClick={() => setActiveFilter("week")}
            className={`px-6 py-2 rounded-xl font-semibold ${
              activeFilter === "week"
                ? "bg-golden text-black hover:bg-golden/90"
                : "bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] border border-gray-600"
            }`}
          >
            هذا الأسبوع
          </Button>
        </div>

        {/* Today Section */}
        <Card className="bg-[#2a2a2a] border-golden/20 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-golden text-lg font-semibold mb-1">اليوم</h2>
              <p className="text-gray-400 text-sm">جميع المعاملات لليوم الحالي</p>
            </div>
            <Calendar className="h-8 w-8 text-golden" />
          </div>
        </Card>

        {/* Transactions List */}
        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <Card
              key={index}
              className="bg-[#2a2a2a] border-l-4 border-l-golden border-r-0 border-t-0 border-b-0 p-4 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="bg-success/20 rounded-full p-2">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{transaction.description}</div>
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{transaction.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-success font-bold text-lg">{transaction.amount}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center py-4">
          <Button
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white bg-transparent"
          >
            تحميل المزيد من المعاملات
          </Button>
        </div>
      </div>
    </div>
  )
}
