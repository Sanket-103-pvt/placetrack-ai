"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <main className="app login-app" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card login-card"
        style={{ textAlign: "center", maxWidth: "480px" }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="brand-mark" 
            style={{ width: "60px", height: "60px", borderRadius: "16px" }}
          >
            <Compass size={32} />
          </motion.div>
        </div>
        
        <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "10px 0 5px", color: "var(--text)" }}>
          404 — Page Not Found
        </h1>
        
        <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 20px" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link 
            href="/dashboard" 
            className="primary-button" 
            style={{ textDecoration: "none", fontSize: "11px", padding: "12px" }}
            aria-label="Go to Dashboard"
          >
            <LayoutDashboard size={14} style={{ marginRight: "6px" }} />
            Go to Dashboard
          </Link>
          
          <Link 
            href="/" 
            className="secondary-button" 
            style={{ textDecoration: "none", fontSize: "11px", padding: "12px" }}
            aria-label="Go Home"
          >
            <Home size={14} style={{ marginRight: "6px" }} />
            Go Home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
