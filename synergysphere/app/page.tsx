"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Users, Zap, BarChart3, Github, Twitter, Linkedin, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Contact", href: "#contact" },
];

const featureCards = [
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: "Smart Task Management",
    desc: "Automated progress tracking with deadline alerts.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Team Collaboration",
    desc: "Real-time communication and seamless file sharing.",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-primary" />,
    title: "Insightful Analytics",
    desc: "Data-driven insights to optimize performance.",
  },
];

const variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] bg-repeat opacity-20 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />

      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
            >
              <Zap className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-extrabold tracking-tight">SynergySphere</span>
          </motion.div>

          <div className="hidden items-center space-x-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden hover:bg-primary/10 md:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg transition hover:shadow-primary/40">Get Started</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-2/3 bg-card p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-4">
                <span className="text-xl font-bold">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="mt-8 flex flex-col items-start space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="w-full text-lg font-medium hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <Link href="/login" className="mt-4 w-full">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={variants}
        className="relative z-10 py-36 text-center"
      >
        <motion.h1 variants={itemVariants} className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          The Future of{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Team Collaboration
          </span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
        >
          Stay organized, communicate better, and work smarter with an intelligent project management platform.
        </motion.p>
        <motion.div variants={itemVariants} className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="px-8 text-lg shadow-md transition hover:shadow-primary/40">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="px-8 text-lg transition hover:scale-[1.02]">
            Watch Demo
          </Button>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold md:text-5xl">Built for Modern Teams</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Everything you need to manage projects, collaborate effectively, and deliver results.
          </p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={variants}
            className="mt-16 grid gap-10 md:grid-cols-3"
          >
            {featureCards.map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group cursor-pointer rounded-3xl border bg-card/70 p-6 shadow-xl transition-all duration-300 hover:shadow-primary/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-24 px-6">
        <div className="container mx-auto grid items-center gap-14 md:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={variants}
          >
            <motion.h2 variants={itemVariants} className="text-4xl font-bold md:text-5xl">
              Why Choose SynergySphere?
            </motion.h2>
            <motion.p variants={itemVariants} className="mt-4 text-lg text-muted-foreground">
              We believe teams thrive when tools adapt to their workflow. That’s why SynergySphere goes
              beyond project management—it’s your intelligent team backbone.
            </motion.p>
            <motion.ul variants={variants} className="mt-6 space-y-4">
              {[
                "Proactive issue detection & resolution",
                "Seamless integration with workflows",
                "Enterprise-grade security & compliance",
              ].map((item, i) => (
                <motion.li key={i} variants={itemVariants} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="rounded-3xl border bg-gradient-to-br from-primary/20 to-accent/20 p-10 text-center shadow-lg"
          >
            <div className="mb-2 text-5xl font-extrabold text-primary md:text-6xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                10,000+
              </span>
            </div>
            <p className="mb-6 text-xl text-muted-foreground">Teams Trust SynergySphere</p>
            <div className="text-4xl font-bold text-primary md:text-5xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">99.9%</span>
            </div>
            <p className="text-xl text-muted-foreground">Uptime Guarantee</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative z-10 border-t border-border bg-card py-14 px-6">
        <div className="container mx-auto">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">SynergySphere</span>
              </div>
              <p className="text-muted-foreground">
                The intelligent collaboration platform for high-performing teams.
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="transition-colors hover:text-primary">Features</a></li>
                <li><a href="#about" className="transition-colors hover:text-primary">About</a></li>
                <li><Link href="/login" className="transition-colors hover:text-primary">Sign In</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-primary">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Contact</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="mailto:support@synergysphere.com" className="hover:text-primary">support@synergysphere.com</a></li>
                <li>+91-800-SYNERGY</li>
                <li>24/7 Support</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Follow Us</h3>
              <div className="flex gap-4 text-muted-foreground">
                <a href="#" aria-label="GitHub" className="transition-colors hover:text-primary"><Github className="h-5 w-5" /></a>
                <a href="#" aria-label="Twitter" className="transition-colors hover:text-primary"><Twitter className="h-5 w-5" /></a>
                <a href="#" aria-label="LinkedIn" className="transition-colors hover:text-primary"><Linkedin className="h-5 w-5" /></a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SynergySphere. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}