"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from "motion/react";
import InteractiveBackground from "@/components/interactive-background";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Camera,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Share2,
  Tag,
  DollarSign,
  Smartphone,
  CheckCircle2,
  Lock,
  MessageCircle,
  CreditCard,
  TrendingUp,
  Eye,
  Check,
  Send,
  Clock,
  ChevronRight,
  Flame,
  Layers,
  Sparkle,
  Menu,
  X,
} from "lucide-react";

// Story tabs to show what is happening on Littlelyst
const STORY_STEPS = [
  {
    id: "sell",
    label: "1. Seller Snaps & Lists",
    tagline: "Post on status, get a live checkout link",
    description: "Ada snaps 3 photos of new thrift arrivals, taps a ₦15,000 preset, and hits publish in 40 seconds.",
    color: "from-emerald-500 to-teal-400",
    badge: "Ada's Thrift Store",
    handle: "ada-thrift",
    product: {
      title: "Vintage Corduroy Jacket (Size L)",
      price: "₦18,500",
      promoPrice: "₦14,000",
      discount: "24% OFF",
      type: "Physical Item",
      stock: "Only 2 left",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80",
    },
    activity: "Created catalogue in 2 mins",
  },
  {
    id: "share",
    label: "2. Shares on WhatsApp",
    tagline: "Rich previews that convert status viewers into buyers",
    description: "Ada pastes lyst.me/ada-thrift on her WhatsApp Status and Instagram DM. Viewers see instant photo + price cards.",
    color: "from-teal-400 to-cyan-400",
    badge: "WhatsApp Status & IG Bio",
    handle: "ada-thrift",
    product: {
      title: "Handmade Croissant Bag — Ivory Cream",
      price: "₦26,000",
      promoPrice: "₦21,500",
      discount: "Flash Sale",
      type: "Fashion & Wear",
      stock: "In Stock",
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80",
    },
    activity: "148 clicks from WhatsApp Status today",
  },
  {
    id: "pay",
    label: "3. Buyer Pays Without Login",
    tagline: "Zero account friction, automated direct payout",
    description: "Chioma taps the link in WhatsApp, enters delivery info, and pays with her card/transfer in 20 seconds.",
    color: "from-cyan-400 to-emerald-400",
    badge: "Instant Direct Checkout",
    handle: "ada-thrift",
    product: {
      title: "UI Designer's Notion OS & Freelance Kit",
      price: "₦12,000",
      promoPrice: "₦8,500",
      discount: "Code: FIRST10",
      type: "Instant Digital Download",
      stock: "Unlimited",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=80",
    },
    activity: "Paid via Direct Bank Transfer • Settled automatically",
  },
];

// Animation variant definitions for timeline staging
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export default function HomePage() {
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeStory = STORY_STEPS[activeStoryIdx];

  // Auto-cycle through the live story preview every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStoryIdx((prev) => (prev + 1) % STORY_STEPS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e4e2] selection:bg-emerald-500 selection:text-black overflow-x-hidden relative">
      {/* Background grid with dots and animations */}
      <InteractiveBackground />

      {/* Background ambient lighting with pulsing glow timelines */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] lg:w-[960px] h-[350px] sm:h-[480px] bg-gradient-to-b from-emerald-500/20 via-teal-500/10 to-transparent blur-[120px] sm:blur-[160px] pointer-events-none -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.05, 0.12, 0.05],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-1/4 right-0 w-[280px] sm:w-[500px] h-[350px] sm:h-[500px] bg-cyan-500/10 blur-[130px] sm:blur-[170px] pointer-events-none -z-10"
      />

      {/* Floating Responsive Header */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl liquid-glass rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border border-white/10 shadow-2xl"
      >
        <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2 sm:gap-3">
          <ThemeToggle size="sm" />
          <Link
            href="/login"
            className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/register"
              className="bg-gradient-to-r from-emerald-500 to-teal-400 text-black px-4 py-1.5 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all inline-block"
            >
              Create Catalogue
            </Link>
          </motion.div>
        </nav>

        {/* Unique Custom Mobile Hamburger & Theme Switcher */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle size="sm" />

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            type="button"
            aria-label="Toggle mobile navigation menu"
            className="relative w-9 h-9 rounded-xl liquid-glass border border-white/10 flex flex-col items-center justify-center gap-1.2 p-2 hover:border-emerald-500/40 transition-all cursor-pointer group"
          >
            <span
              className={`w-5 h-[2px] rounded-full bg-emerald-400 transition-all duration-300 origin-center ${
                mobileMenuOpen ? "rotate-45 translate-y-[3.5px]" : ""
              }`}
            />
            <span
              className={`w-3.5 h-[2px] rounded-full bg-cyan-400 transition-all duration-300 self-end ${
                mobileMenuOpen ? "opacity-0 scale-0" : "group-hover:w-5"
              }`}
            />
            <span
              className={`w-5 h-[2px] rounded-full bg-teal-300 transition-all duration-300 origin-center ${
                mobileMenuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
              }`}
            />
          </button>
        </div>
      </motion.header>

      {/* Mobile Navigation Sheet Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-45 w-[94%] max-w-5xl liquid-glass-card rounded-2xl p-4 md:hidden border border-white/15 shadow-2xl space-y-3"
          >
            <div className="flex flex-col space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 flex items-center justify-between transition-colors border border-white/5"
              >
                <span>Seller Sign In</span>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-black font-extrabold text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:opacity-95 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Create Free Catalogue
              </Link>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 px-1">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Littlelyst Platform Engine
              </span>
              <span className="text-emerald-400 font-semibold">Active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="relative z-10 pt-24 sm:pt-36 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-16 sm:space-y-28">
        {/* Hero Section: flex-col on mobile, flex-row on desktop */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 pt-4 sm:pt-0">
          {/* Left Column: Headline, Copy & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 text-center lg:text-left space-y-5 sm:space-y-6"
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full liquid-glass-subtle border border-emerald-500/30 text-[11px] sm:text-xs font-medium text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
                <span>Social-Commerce Catalogue Platform</span>
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] sm:leading-[1.08]"
            >
              Your products. One link.{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent block sm:inline">
                Instant Online Payments.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xs sm:text-base text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Turn your phone into a live, payable storefront in under 5 minutes. No buyer logins,
              zero complicated store builders, built-in flash sales & coupon limits.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-1"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-black font-extrabold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Create Your Free Catalogue
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl liquid-glass-button text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  Seller Dashboard
                  <ArrowRight className="w-4 h-4 text-white/50" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              variants={itemVariants}
              className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs text-white/50 font-medium"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" /> No login for buyers
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-teal-400" /> Cards & transfers
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-400" /> WhatsApp Status ready
              </span>
            </motion.div>
          </motion.div>

          {/* Right Column: Hero Visual Product Image & Mobile Store Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[440px] shrink-0 relative"
          >
            {/* Ambient Back Glow with subtle float */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent blur-3xl rounded-3xl pointer-events-none"
            />

            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-3xl liquid-glass-card border border-white/20 p-4 sm:p-5 shadow-2xl overflow-hidden backdrop-blur-2xl space-y-3.5 sm:space-y-4"
            >
              {/* Browser/Device Bar Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="liquid-glass-subtle px-3 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-white/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>lyst.me/ada-boutique</span>
                </div>
                <span className="text-[10px] text-white/40 font-mono">Live Link</span>
              </div>

              {/* Product Hero Image */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 border border-white/10 relative shadow-xl group">
                <img
                  src="https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"
                  alt="Littlelyst Seller Product Catalogue"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10">
                    Physical Wear
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-lg">
                    <Flame className="w-2.5 h-2.5 animate-pulse" /> 25% OFF Promo
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-2.5 right-2.5 liquid-glass p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-xs backdrop-blur-md">
                  <div>
                    <span className="text-[9px] text-white/50 block">Live Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-black text-rose-400 text-sm">₦14,000</span>
                      <span className="text-[10px] text-white/40 line-through">₦18,500</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Only 2 left
                  </span>
                </div>
              </div>

              {/* Product Info & Direct Buy CTA */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Vintage Corduroy Oversized Jacket
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    Hand-picked vintage piece, pristine condition. Instant checkout with card or direct bank transfer.
                  </p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <div className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer">
                    <span>One-Tap Pay Now</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      ₦14,000 <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>

                <div className="flex items-center justify-between text-[10px] text-white/50 px-1 pt-0.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <MessageCircle className="w-3 h-3" /> WhatsApp Status Link
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-cyan-400" /> Buyer Protection
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Dynamic Interactive Story & Live Store Device Showcase */}
        <section className="space-y-6 sm:space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55 }}
            className="text-center space-y-2"
          >
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              How Littlelyst Actually Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              A Complete Commerce Story in 3 Moments
            </h2>
            <p className="text-xs sm:text-sm text-white/50 max-w-lg mx-auto">
              Tap each moment to see how casual sellers turn status updates into instant sales.
            </p>
          </motion.div>

          {/* Story Steps Navigation Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {STORY_STEPS.map((step, idx) => (
              <motion.button
                key={step.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveStoryIdx(idx)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  activeStoryIdx === idx
                    ? "bg-white/15 border-emerald-400/60 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeStoryIdx === idx ? "bg-emerald-400 animate-ping" : "bg-white/30"
                  }`}
                />
                <span>{step.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Interactive Live Story Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="liquid-glass-card rounded-3xl p-5 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              {/* Story Narrative Column */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStory.id}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 18 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{activeStory.badge}</span>
                    </div>

                    <h3 className="text-xl sm:text-3xl font-black text-white leading-tight">
                      {activeStory.tagline}
                    </h3>

                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                      {activeStory.description}
                    </p>

                    {/* Live activity ticker */}
                    <div className="p-3.5 rounded-xl liquid-glass-subtle border border-white/10 flex items-center gap-3 text-xs">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-white/40 block">Live Activity</span>
                        <span className="text-white font-semibold">{activeStory.activity}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-4">
                      <Link
                        href="/register"
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 group cursor-pointer"
                      >
                        Try this for your products{" "}
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Story Visual / Mobile Device Frame Preview */}
              <div className="lg:col-span-6 flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStory.id}
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -15 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className="w-full max-w-[340px] rounded-[32px] p-2.5 sm:p-3 bg-gradient-to-b from-white/20 via-white/5 to-transparent border border-white/20 shadow-2xl"
                  >
                    {/* Device Shell */}
                    <div className="rounded-[24px] bg-[#090909] border border-white/10 overflow-hidden relative space-y-3 p-3.5 sm:p-4">
                      {/* Top Status Bar & Notch */}
                      <div className="flex items-center justify-between text-[10px] text-white/50 px-1">
                        <span className="font-mono">lyst.me/{activeStory.handle}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>

                      {/* Product Card Inside Phone */}
                      <div className="rounded-2xl overflow-hidden bg-black/60 border border-white/10 space-y-3 relative group">
                        <div className="aspect-[4/3] w-full relative overflow-hidden bg-white/5">
                          <img
                            src={activeStory.product.image}
                            alt={activeStory.product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/10">
                              {activeStory.product.type}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-lg">
                              <Flame className="w-2.5 h-2.5" /> {activeStory.product.discount}
                            </span>
                          </div>
                        </div>

                        <div className="px-3 pb-3 space-y-2">
                          <h4 className="text-xs font-bold text-white line-clamp-1">
                            {activeStory.product.title}
                          </h4>

                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-black text-rose-400">
                                {activeStory.product.promoPrice}
                              </span>
                              <span className="text-[10px] text-white/40 line-through">
                                {activeStory.product.price}
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {activeStory.product.stock}
                            </span>
                          </div>

                          {/* 1-Tap Buy Button Mock */}
                          <div className="pt-1">
                            <div className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                              <span>Buy Now • No Login</span>
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp / Social Referral Tag Badge */}
                      <div className="liquid-glass-subtle p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[10px] text-white/70">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <MessageCircle className="w-3 h-3" /> Opened from WhatsApp
                        </span>
                        <span className="text-white/40">Zero setup</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Feature Grid with Staggered Scroll Timeline */}
        <section className="relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={containerVariants}
            className="liquid-glass-card rounded-3xl p-5 sm:p-10 border border-white/15 relative overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="space-y-3 p-4 rounded-2xl liquid-glass-subtle border border-transparent hover:border-emerald-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Social-First Catalogue</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Personalized link (e.g. lyst.me/ada) that renders gorgeous rich previews on WhatsApp Status,
                  Instagram DMs, and Facebook.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="space-y-3 p-4 rounded-2xl liquid-glass-subtle border border-transparent hover:border-teal-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Promos & Capped Coupons</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Run 24-hour flash sales with live count-down timers and coupon codes capped to the first 10 buyers,
                  guaranteed race-condition safe.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="space-y-3 p-4 rounded-2xl liquid-glass-subtle border border-transparent hover:border-cyan-500/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Flexible Online Payments</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Buyers pay via card, bank transfer, USSD, or mobile money. Payouts settle automatically
                  into your bank account without manual invoice friction.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* 3-Step Flow with Timeline Reveal */}
        <section className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="text-center space-y-1"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              From Setup to First Sale in 3 Steps
            </h2>
            <p className="text-xs text-white/50">
              Designed for creators, side-hustlers, and boutique sellers.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="liquid-glass p-5 rounded-2xl space-y-2 border border-white/10"
            >
              <span className="text-xs font-mono text-emerald-400 font-bold">STEP 01</span>
              <h4 className="text-sm font-bold text-white">Snap & List Products</h4>
              <p className="text-xs text-white/50">
                Upload physical items or digital downloads with one tap. Set price and stock in seconds.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="liquid-glass p-5 rounded-2xl space-y-2 border border-white/10"
            >
              <span className="text-xs font-mono text-teal-400 font-bold">STEP 02</span>
              <h4 className="text-sm font-bold text-white">Share Your Link</h4>
              <p className="text-xs text-white/50">
                Paste your store link on WhatsApp Status, Instagram Bio, or Google Business Profile.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="liquid-glass p-5 rounded-2xl space-y-2 border border-white/10"
            >
              <span className="text-xs font-mono text-cyan-400 font-bold">STEP 03</span>
              <h4 className="text-sm font-bold text-white">Get Paid Instantly</h4>
              <p className="text-xs text-white/50">
                Customers buy with zero logins. Funds deposit directly to your bank account.
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-white/40">
        Littlelyst Social-Commerce Platform © 2026. Made for modern social sellers & creators.
      </footer>
    </div>
  );
}
