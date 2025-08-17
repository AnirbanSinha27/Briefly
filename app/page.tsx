"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Sparkles, Mail, Upload, CheckCircle, X } from "lucide-react"
// import { useToast } from "@/hooks/use-toast" // Unused for now

declare global {
  interface Window {
    emailjs: {
      init: (publicKey: string) => void
      send: (serviceId: string, templateId: string, templateParams: Record<string, unknown>) => Promise<unknown>
    }
    gsap: {
      fromTo: (target: unknown, fromVars: unknown, toVars: unknown) => unknown
      to: (target: unknown, vars: unknown) => unknown
    }
  }
}

const CustomToast = ({
  message,
  type,
  onClose,
}: { message: string; type: "success" | "error"; onClose: () => void }) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 min-w-80 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        {type === "success" ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-red-500" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{message}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function BrieflyApp() {
  const [transcript, setTranscript] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [summary, setSummary] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState("")
  const [customToast, setCustomToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  // const { toast } = useToast() // Unused for now

  const headerRef = useRef(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const summaryRef = useRef(null)

  useEffect(() => {
    if (customToast) {
      const timer = setTimeout(() => {
        setCustomToast(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [customToast])

  const showCustomToast = (message: string, type: "success" | "error") => {
    setCustomToast({ message, type })
  }

  useEffect(() => {
    const gsapScript = document.createElement("script")
    gsapScript.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
    gsapScript.onload = () => {
      if (window.gsap) {
        window.gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: -50 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
        )

        window.gsap.fromTo(
          cardsRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "power2.out", delay: 0.3 },
        )
      }
    }
    document.head.appendChild(gsapScript)

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
    script.onload = () => {
      window.emailjs.init("Iv8OO9xlRo9KDb5Aa") // Replace with your EmailJS public key
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(gsapScript)
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (summary && summaryRef.current && window.gsap) {
      window.gsap.fromTo(
        summaryRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" },
      )
    }
  }, [summary])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setTranscript(content)
        showCustomToast("File uploaded successfully! Your transcript is ready for summarization.", "success")
      }
      reader.readAsText(file)
    } else {
      showCustomToast("Please upload a .txt file containing your meeting transcript.", "error")
    }
  }

  const generateSummary = async () => {
    if (!transcript.trim()) {
      showCustomToast("Please upload a transcript or paste your meeting notes.", "error")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          customPrompt:
            customPrompt ||
            "Summarize this meeting transcript in a clear, structured format with key points and action items.",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      setSummary(data.summary)
      showCustomToast(
        "Summary generated successfully! Your AI-powered summary is ready. You can edit it before saving or sharing.",
        "success",
      )
    } catch {
      showCustomToast("Error generating summary. Please try again.", "error")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveSummary = async (summaryToSave?: string) => {
    const currentSummary = summaryToSave || summary
    if (!currentSummary.trim() || !transcript.trim()) {
      showCustomToast("Cannot save: Missing summary or transcript.", "error")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/save-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          summary: currentSummary,
          customPrompt,
          emailRecipients,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save summary")
      }

      await response.json()
      if (!summaryToSave) {
        showCustomToast("Summary saved to database successfully!", "success")
      }
    } catch {
      showCustomToast("Error saving summary. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const sendEmail = async () => {
    console.log("[v0] sendEmail function called")

    if (!summary.trim() || !emailRecipients.trim()) {
      console.log("[v0] Missing summary or recipients")
      showCustomToast("Please ensure you have a summary and email recipients.", "error")
      return
    }

    if (!window.emailjs) {
      console.log("[v0] EmailJS not loaded")
      showCustomToast("Email service not ready. Please wait a moment and try again.", "error")
      return
    }

    setIsSending(true)
    try {
      const recipients = emailRecipients.split(",").map((email) => email.trim())
      console.log("[v0] Sending to recipients:", recipients)

      for (const recipient of recipients) {
        console.log("[v0] Sending email to:", recipient)
        await window.emailjs.send(
          "service_c2izlss", // Replace with your EmailJS service ID
          "template_w3f2vwq", // Replace with your EmailJS template ID
          {
            to_email: recipient,
            subject: "Meeting Summary from Briefly",
            message: summary,
            from_name: "Briefly App",
          },
        )
      }

      console.log("[v0] All emails sent successfully")
      await saveSummary()
      showCustomToast(
        `✨ Email sent successfully! Your meeting summary has been shared with ${recipients.length} recipient(s).`,
        "success",
      )
      setEmailRecipients("")
    } catch (error) {
      console.error("[v0] EmailJS error:", error)
      showCustomToast("Error sending email. Please check the email addresses and try again.", "error")
    } finally {
      setIsSending(false)
    }
  }

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (window.gsap) {
      window.gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2, ease: "power2.out" })
    }
  }

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (window.gsap) {
      window.gsap.to(e.currentTarget, { scale: 1, duration: 0.2, ease: "power2.out" })
    }
  }

  const quickPrompts = [
    "Summarize in bullet points for executives",
    "Highlight only action items and deadlines",
    "Create a detailed technical summary",
    "Focus on decisions made and next steps",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {customToast && (
        <CustomToast message={customToast.message} type={customToast.type} onClose={() => setCustomToast(null)} />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-primary/10 backdrop-blur-sm">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Briefly
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Transform your meeting transcripts into structured summaries with AI
          </p>
        </div>

        <div className="grid gap-6">
          {/* Upload Section */}
          <Card
            ref={(el) => {
              cardsRef.current[0] = el
            }}
            className="border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                Upload Transcript
              </CardTitle>
              <CardDescription>Upload a text file or paste your meeting transcript below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Upload .txt file</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="mt-1 border-dashed hover:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="transcript">Or paste transcript here</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your meeting transcript here..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-32 mt-1 resize-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Prompt Section */}
          <Card
            ref={(el) => {
              cardsRef.current[1] = el
            }}
            className="border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                Customize Summary
              </CardTitle>
              <CardDescription>Choose a quick prompt or write your own instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-all duration-200 hover:scale-105"
                    onClick={() => setCustomPrompt(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
              <div>
                <Label htmlFor="custom-prompt">Custom instructions</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="e.g., Summarize in bullet points for executives..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="mt-1 resize-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button
                onClick={generateSummary}
                disabled={isGenerating || !transcript.trim()}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary Section */}
          {summary && (
            <Card
              ref={summaryRef}
              className="border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-green-500/10">
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                  Generated Summary
                </CardTitle>
                <CardDescription>Edit the summary as needed before sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-48 resize-none focus:ring-2 focus:ring-primary/20"
                />

                {/* Manual Save Button */}
                <Button
                  onClick={() => saveSummary()}
                  disabled={isSaving || !summary.trim()}
                  variant="outline"
                  className="w-full"
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Save Summary
                    </>
                  )}
                </Button>

                {/* Email Section */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div>
                    <Label htmlFor="email-recipients">Email recipients</Label>
                    <Input
                      id="email-recipients"
                      placeholder="email1@example.com, email2@example.com"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      className="mt-1 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <Button
                    onClick={sendEmail}
                    disabled={isSending || !summary.trim() || !emailRecipients.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300"
                    onMouseEnter={handleButtonHover}
                    onMouseLeave={handleButtonLeave}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Share via Email
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
