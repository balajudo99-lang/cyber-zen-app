"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface SoulTreeHollowProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function Modal({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode 
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      {/* Backdrop - completely opaque */}
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: '#F5F3EF',
          animation: 'fadeIn 0.4s ease-out',
        }}
      />
      {/* Ambient glow on backdrop */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, rgba(243, 229, 171, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-sm"
        style={{ zIndex: 10, animation: 'slideUp 0.5s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  )
}

// Dify API 設定
const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages"
const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY

type SubmitState = "idle" | "loading" | "success" | "error"

export function SoulTreeHollow({ isOpen, onOpenChange }: SoulTreeHollowProps) {
  const [inputValue, setInputValue] = useState("")
  const [submitState, setSubmitState] = useState<SubmitState>("idle")
  const [aiResponse, setAiResponse] = useState("")
  const [glowIntensity, setGlowIntensity] = useState(0.5)

  // Gentle breathing animation for the glow
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => {
        const newValue = prev + (Math.random() * 0.1 - 0.05)
        return Math.max(0.3, Math.min(0.7, newValue))
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    if (!inputValue.trim()) return
    
    setSubmitState("loading")
    setAiResponse("")

    try {
      const response = await fetch(DIFY_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          query: inputValue.trim(),
          response_mode: "streaming",
          user: "balajudo99",
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      // 處理串流回應
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

      const decoder = new TextDecoder()
      let fullAnswer = ""
      
      // 開始接收串流時立即切換到成功狀態以顯示文字
      setSubmitState("success")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim()
            if (jsonStr && jsonStr !== '[DONE]') {
              try {
                const data = JSON.parse(jsonStr)
                if (data.answer) {
                  fullAnswer = data.answer
                  setAiResponse(fullAnswer)
                }
              } catch {
                // 忽略無法解析的 JSON
              }
            }
          }
        }
      }

      // 若串流結束但沒有收到任何回應
      if (!fullAnswer) {
        setAiResponse("光與愛已收到你的心聲，請靜心感受內在的指引。")
      }
      
    } catch (error) {
      setAiResponse("連線暫時受阻，但宇宙已收到你的心聲。請稍後再試。")
      setSubmitState("error")
    }
  }

  const handleClose = () => {
    if (submitState === "loading") return // 載入中不允許關閉
    setInputValue("")
    setSubmitState("idle")
    setAiResponse("")
    onOpenChange(false)
  }

  return (
    <>
      {/* Main Glowing Orb Button */}
      <button
        onClick={() => onOpenChange(true)}
        className="group relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700 ease-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-4 focus:ring-offset-background"
        style={{
          background: `radial-gradient(circle at 40% 40%, var(--cream-white), var(--sacred-gold))`,
          boxShadow: `
            0 0 ${30 + glowIntensity * 20}px ${glowIntensity * 15}px var(--glow-gold),
            0 0 ${60 + glowIntensity * 30}px ${glowIntensity * 25}px rgba(243, 229, 171, 0.3),
            inset 0 -4px 20px rgba(0, 0, 0, 0.05)
          `,
        }}
        aria-label="開啟靈魂樹洞"
      >
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        <span className="relative text-foreground/80 text-sm font-light tracking-widest">
          樹洞
        </span>
      </button>
      
      <p className="mt-6 text-xs text-muted-foreground/60 font-light tracking-wide">
        輕觸圓滿，傾訴心聲
      </p>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div 
          className="rounded-3xl p-6 sm:p-8 border border-border/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(253,252,250,0.95) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 80px rgba(243, 229, 171, 0.3)',
          }}
        >
          {submitState === "loading" ? (
            // Loading State - 照見本心中
            <div className="text-center py-12">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-pulse"
                style={{
                  background: 'radial-gradient(circle, var(--sacred-gold), var(--sage-green))',
                  boxShadow: '0 0 40px var(--glow-gold)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              >
                <svg className="w-10 h-10 text-foreground/60 animate-spin" style={{ animationDuration: '3s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                </svg>
              </div>
              <p className="text-foreground font-light text-lg mb-2 tracking-wider">
                正在照見本心
              </p>
              <p className="text-muted-foreground/60 text-sm font-light">
                請稍候...
              </p>
            </div>
          ) : submitState === "success" || submitState === "error" ? (
            // Response State - 顯示 AI 回覆
            <div className="text-center py-4">
              <div 
                className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center"
                style={{
                  background: submitState === "success" 
                    ? 'radial-gradient(circle, var(--sacred-gold), var(--sage-green))'
                    : 'radial-gradient(circle, var(--misty-gray), var(--sage-green))',
                  boxShadow: '0 0 25px var(--glow-gold)',
                }}
              >
                {submitState === "success" ? (
                  <svg className="w-7 h-7 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              
              <p className="text-foreground/80 font-light text-xs uppercase tracking-[0.3em] mb-4">
                {submitState === "success" ? "本心智慧" : "宇宙訊息"}
              </p>
              
              {/* AI Response Display - 放大字體優化閱讀體驗 */}
              <div 
                className="max-h-72 overflow-y-auto mb-6 px-3 text-left"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--border) transparent',
                }}
              >
                <p 
                  className="text-foreground/90 font-light whitespace-pre-wrap"
                  style={{
                    fontSize: '18px',
                    lineHeight: 1.6,
                  }}
                >
                  {aiResponse}
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-full text-sm font-light transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, var(--sacred-gold), var(--sage-green))',
                  color: 'var(--foreground)',
                  boxShadow: '0 4px 20px var(--glow-gold)',
                }}
              >
                感恩接收
              </button>
            </div>
          ) : (
            // Input State
            <>
              <h3 className="text-center text-foreground text-lg font-light mb-2 tracking-wider">
                靈魂樹洞
              </h3>
              <p className="text-center text-muted-foreground/70 text-xs font-light mb-6">
                在此傾倒紅塵中的情緒
              </p>
              
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="寫下此刻的心聲..."
                className="w-full h-32 px-4 py-3 rounded-2xl bg-white/60 border border-border/20 text-foreground placeholder:text-muted-foreground/40 text-sm font-light leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300"
                autoFocus
              />
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 py-3 rounded-full text-sm font-light text-muted-foreground/70 transition-colors duration-300 hover:text-foreground"
                >
                  輕輕離開
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className="flex-1 py-3 rounded-full text-sm font-light transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--sacred-gold), var(--sage-green))',
                    color: 'var(--foreground)',
                    boxShadow: inputValue.trim() ? '0 4px 20px var(--glow-gold)' : 'none',
                  }}
                >
                  送入樹洞
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
