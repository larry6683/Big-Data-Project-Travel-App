import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-theme-text text-theme-bg pt-16 pb-8 border-t-4 border-theme-primary shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 relative mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          
          {/* 1. Brand Section */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <svg viewBox="0 0 1050 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 sm:h-12 w-auto -ml-2">
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;700&display=swap');
                  .footer-logo-text {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont;
                    font-size: 100px;
                    letter-spacing: -0.04em;
                  }
                `}</style>
<path 
  d="M 20 160 C 100 40, 90 40, 120 120" 
  className=" fill-theme-primary" 
  strokeWidth="10" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
/>
<path 
  d="M 120 120 C 180 20, 180 20, 200 140" 
  className=" fill-theme-primary" 
  strokeWidth="10" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
/>            
<line x1="220" y1="20" x2="220" y2="180" stroke="#04381C" strokeWidth="10" strokeLinecap="round" />
  <text x="240" y="120" className="footer-logo-text">
                  <tspan className="font-semibold fill-theme-primary">Minute</tspan>
                  <tspan className="font-bold fill-theme-primary">bound</tspan>
                </text>
              </svg>
            </Link>
            <p className="text-sm text-theme-bg/70 leading-relaxed max-w-sm font-medium">
              Your intelligent travel companion. Plan flights, accommodations, road trips, and seamless adventures in minutes.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="#" icon={<Facebook size={18} />} />
              <SocialLink href="#" icon={<Twitter size={18} />} />
              <SocialLink href="#" icon={<Instagram size={18} />} />
            </div>
          </div>

          {/* 2. Quick Links */}
          <div className="flex flex-col gap-4 lg:pl-8">
            <h4 className="font-black text-lg text-theme-bg tracking-wide mb-2 uppercase text-[13px]">Explore</h4>
            <FooterLink href="/" text="Home" />
            <FooterLink href="/" text="Trip Planner" />
            <FooterLink href="/savedtrips" text="Saved Itineraries" />
            <FooterLink href="/profile" text="Your Account" />
          </div>

          {/* 3. Support */}
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-lg text-theme-bg tracking-wide mb-2 uppercase text-[13px]">Support</h4>
            <FooterLink href="#" text="Help Center & FAQ" />
            <FooterLink href="#" text="Privacy Policy" />
            <FooterLink href="#" text="Terms of Service" />
            <FooterLink href="#" text="Cancellation Policy" />
          </div>

          {/* 4. Contact Details */}
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-lg text-theme-bg tracking-wide mb-2 uppercase text-[13px]">Contact Us</h4>
            
            {/* <div className="flex items-start gap-3 text-sm text-theme-bg/70 hover:text-theme-bg transition-colors group">
              <MapPin size={18} className="shrink-0 text-theme-primary mt-0.5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">123 Explorer Way, Suite 400<br/>Boulder, CO 80302</span>
            </div>
            
            <a href="tel:+18005550199" className="flex items-center gap-3 text-sm text-theme-bg/70 hover:text-theme-bg transition-colors group">
              <Phone size={18} className="shrink-0 text-theme-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">+1 (800) 555-0199</span>
            </a>
            
            <a href="mailto:support@minutebound.com" className="flex items-center gap-3 text-sm text-theme-bg/70 hover:text-theme-bg transition-colors group">
              <Mail size={18} className="shrink-0 text-theme-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">support@minutebound.com</span>
            </a> */}
          </div>

        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 border-t border-theme-bg/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-theme-bg/50 font-bold tracking-widest uppercase">
            © {new Date().getFullYear()} MinuteBound Travel LLC. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}

// Sub-components for cleaner code
function FooterLink({ href, text }: { href: string; text: string }) {
  return (
    <Link 
      href={href} 
      className="text-sm font-bold text-theme-bg/60 hover:text-theme-primary transition-colors w-fit relative group"
    >
      {text}
      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-theme-primary transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-xl bg-theme-bg/5 border border-theme-bg/10 flex items-center justify-center text-theme-bg/80 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-all shadow-sm active:scale-95"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}