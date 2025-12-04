"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Briefcase, Users, TrendingUp, Sparkles } from "lucide-react";
import animationData from "../../public/lottie_animation/animation-02/watermelon-pack-animation-02.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
        <div className="hero-content max-w-7xl mx-auto px-4 py-12 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            
            {/* Left Column - Hero Text */}
            <div className="text-center lg:text-left space-y-6">
              <div className="space-y-2">
                <div className="badge badge-primary badge-outline gap-2">
                  <Sparkles size={14} />
                  AI-Powered Recruitment
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  Find Your{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Dream Job
                  </span>
                </h1>
              </div>
              
              <p className="text-lg sm:text-xl text-base-content/70 max-w-lg mx-auto lg:mx-0">
                Streamline your hiring process with AI-powered candidate matching and intelligent scheduling.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/jobs" className="btn btn-primary btn-lg gap-2">
                  <Briefcase size={20} />
                  Browse Jobs
                </Link>
                <Link href="/signup" className="btn btn-outline btn-lg">
                  Get Started
                </Link>
              </div>

              {/* Stats */}
              <div className="stats stats-vertical sm:stats-horizontal shadow-sm bg-base-200 w-full">
                <div className="stat place-items-center">
                  <div className="stat-value text-primary text-3xl">500+</div>
                  <div className="stat-desc">Active Jobs</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-value text-secondary text-3xl">2K+</div>
                  <div className="stat-desc">Applicants</div>
                </div>
                <div className="stat place-items-center">
                  <div className="stat-value text-accent text-3xl">95%</div>
                  <div className="stat-desc">Match Rate</div>
                </div>
              </div>
            </div>

            {/* Right Column - Animation */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md lg:max-w-lg">
                <Lottie animationData={animationData} loop autoplay />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-base-200 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">Velocity H</span>?
            </h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with intuitive design to transform your recruitment experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="text-primary" size={32} />
                </div>
                <h3 className="card-title">AI-Powered Matching</h3>
                <p className="text-base-content/70">
                  Intelligent algorithms match candidates with the perfect roles based on skills and experience.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="text-secondary" size={32} />
                </div>
                <h3 className="card-title">Smart Scheduling</h3>
                <p className="text-base-content/70">
                  Automated interview scheduling that saves time and eliminates back-and-forth coordination.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow">
              <div className="card-body items-center text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <TrendingUp className="text-accent" size={32} />
                </div>
                <h3 className="card-title">Real-time Analytics</h3>
                <p className="text-base-content/70">
                  Track your hiring pipeline with comprehensive insights and performance metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="hero bg-gradient-to-r from-primary to-secondary py-20">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join hundreds of companies using Velocity H to find the best talent faster and smarter.
            </p>
            <Link href="/signup" className="btn btn-lg bg-white text-primary hover:bg-base-100">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
