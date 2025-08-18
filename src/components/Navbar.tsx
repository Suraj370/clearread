import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link'

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">DR</span>
            </div>
            <span className="text-2xl font-bold text-foreground">DyslexiaRead</span>
          </div>
          
 
          
          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
            <Button asChild className="hidden sm:inline-flex">
             <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-white shadow-md text-slate-900 hover:opacity-90">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar