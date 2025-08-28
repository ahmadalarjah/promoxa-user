"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Headphones,
  MessageCircle,
  CheckCircle,
  Clock,
  FileText
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useLanguage } from "@/contexts/LanguageContext"
import { apiService, SupportTicket } from "@/lib/api"
import ProtectedRoute from "@/components/ProtectedRoute"
import { NavigationHeader } from "@/components/navigation-header"

export default function SupportPage() {
  const { user } = useAuth()
  const { t, isRTL } = useLanguage()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showForm, setShowForm] = useState(false)

  const loadTickets = async () => {
    try {
      const response = await apiService.getSupportTickets()
      if (response.success && response.data) {
        setTickets(response.data)
      } else {
        setError(t('support.loadError'))
      }
    } catch (error) {
      setError(t('support.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async () => {
    if (!subject.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      const response = await apiService.createSupportTicket(subject, description)
      if (response.success && response.data) {
        setTickets(prev => [response.data, ...prev])
        setSubject("")
        setDescription("")
        setShowForm(false)
        setError("")
      } else {
        setError(t('support.createError'))
      }
    } catch (error) {
      setError(t('support.createError'))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'IN_PROGRESS':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'CLOSED':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4" />
      case 'CLOSED':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-golden animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('support.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        {/* Navigation Header */}
        <NavigationHeader 
          title={t('support.title')}
          onBack={() => window.history.back()}
        />

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border-b border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Create New Ticket Button */}
        <div className="p-4">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-golden hover:bg-golden/90 text-black"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showForm ? t('support.cancel') : t('support.createTicket')}
          </Button>
        </div>

        {/* Create Ticket Form */}
        {showForm && (
          <div className="p-4">
            <Card className="bg-card-custom border-golden/20 p-4">
              <h3 className="text-golden font-semibold mb-4">{t('support.newTicket')}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('support.subject')} *
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('support.subjectPlaceholder')}
                    className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('support.description')} *
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('support.descriptionPlaceholder')}
                    className="bg-[#1a1a1a] border-golden/20 text-white placeholder-gray-500"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={createTicket}
                    disabled={!subject.trim() || !description.trim() || submitting}
                    className="flex-1 bg-golden hover:bg-golden/90 text-black"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? t('support.creating') : t('support.create')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tickets.length === 0 && !showForm ? (
            <Card className="bg-blue-500/10 border-blue-500/20 p-6 text-center">
              <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-blue-400 font-semibold mb-2">{t('support.noTickets')}</h3>
              <p className="text-blue-300 text-sm mb-4">
                {t('support.noTicketsMessage')}
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-golden hover:bg-golden/90 text-black"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('support.createFirstTicket')}
              </Button>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="bg-card-custom border-golden/20 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{ticket.subject}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                  </div>
                  <Badge className={`${getStatusColor(ticket.status)} flex items-center space-x-1`}>
                    {getStatusIcon(ticket.status)}
                    <span>{ticket.status}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(ticket.createdAt)}</span>
                  <span>{ticket.messages?.length || 0} {t('support.messages')}</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Info Card */}
        <div className="p-4">
          <Card className="bg-card-custom border-golden/20 p-4">
            <h3 className="text-golden font-semibold mb-3">{t('support.infoTitle')}</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <p>{t('support.responseTime')}</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <p>{t('support.workingHours')}</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <p>{t('support.anytimeMessage')}</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-golden rounded-full mt-2 flex-shrink-0"></div>
                <p>{t('support.urgentContact')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
