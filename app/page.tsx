"use client"

import { useState, useEffect } from 'react'
import Header from '@/app/shadow/components/Header'
import Hero from '@/app/shadow/components/Hero'
import HowItWorks from '@/app/shadow/components/HowItWorks'
import UseCases from '@/app/shadow/components/UseCases'
import Comparison from '@/app/shadow/components/Comparison'
import PlatformFeatures from '@/app/shadow/components/PlatformFeatures'
import Testimonials from '@/app/shadow/components/Testimonials'
import FAQ from '@/app/shadow/components/FAQ'
import Footer from '@/app/shadow/components/Footer'
import { observeElements } from '@/app/shadow/utils/scrollAnimation'
import { initParallax, initRevealOnScroll } from '@/app/shadow/utils/parallax'

// Import all CSS files directly (not using @import)
import './landing.css'




export default function LandingPage() {
    const [darkMode, setDarkMode] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem('darkMode')
        if (saved) {
            setDarkMode(JSON.parse(saved))
        }
    }, [])

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('darkMode', JSON.stringify(darkMode))
            // Set theme on both html and body
            document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
            document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light')
        }
    }, [darkMode, mounted])

    useEffect(() => {
        if (mounted) {
            const cleanup1 = observeElements()
            const cleanup2 = initParallax()
            const cleanup3 = initRevealOnScroll()

            return () => {
                cleanup1()
                cleanup2()
                cleanup3()
            }
        }
    }, [mounted])

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
    }

    if (!mounted) {
        return null
    }

    return (
        <div className={`App ${darkMode ? 'dark' : 'light'}`} data-theme={darkMode ? 'dark' : 'light'}>
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <Hero darkMode={darkMode} />
            <HowItWorks darkMode={darkMode} />
            <UseCases darkMode={darkMode} />
            <Comparison darkMode={darkMode} />
            <PlatformFeatures darkMode={darkMode} />
            <Testimonials darkMode={darkMode} />
            <FAQ darkMode={darkMode} />
            <Footer darkMode={darkMode} />
        </div>
    )
}
