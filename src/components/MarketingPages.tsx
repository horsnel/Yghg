import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Briefcase, ChevronRight, FileText, Globe, Building2, Workflow, Star, Shield, HelpCircle } from 'lucide-react';
import { fashionCollection } from '../data/fashionImages.ts';

const PageHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gray-900 border-b border-gray-800">
    <div className="absolute inset-0 z-0">
      <img src={fashionCollection[15]?.thumbnail || "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=2000"} alt="Fashion background" className="w-full h-full object-cover opacity-20" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
    </div>
    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-display font-semibold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400"
      >
        {title}
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light"
      >
        {subtitle}
      </motion.p>
    </div>
  </div>
);

export function AboutUs() {
  return (
    <div className="flex-1 bg-gray-50 h-full overflow-y-auto w-full">
      <PageHeader title="About Couture AI" subtitle="Pioneering the intersection of artificial intelligence and high fashion design." />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <h2 className="text-3xl font-display font-medium text-gray-900 mb-6">Redefining Creation</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Founded by a collective of machine learning researchers and former creative directors, Couture AI exists to augment the fashion design process, not replace it. We believe true innovation happens when algorithmic capabilities meet human intuition.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our studio platform analyzes millions of historical design data points, current global micro-trends, and material properties to provide unprecedented insights and generative capabilities to working designers and fashion houses worldwide.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-3xl font-display font-semibold text-gray-900 mb-2">12k+</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Designers</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-3xl font-display font-semibold text-gray-900 mb-2">50M</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Designs Generated</div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-[2rem] shadow-xl border border-gray-200">
            <img src={fashionCollection[20]?.thumbnail || "https://images.unsplash.com/photo-1558769132-cb1fac0840c2?auto=format&fit=crop&q=80&w=1200"} alt="Atelier" className="w-full h-auto rounded-[1.5rem] object-cover aspect-square" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContactUs() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
    }, 1200);
  };

  return (
    <div className="flex-1 bg-gray-50 h-full overflow-y-auto w-full">
      <PageHeader title="Contact Us" subtitle="We're here to help you scale your design operations." />
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <Mail className="w-6 h-6 text-gray-900 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Email</h3>
              <p className="text-sm text-gray-500 mb-4">Our friendly team is here to help.</p>
              <a href="mailto:hello@couture.ai" className="text-sm font-semibold text-blue-600 hover:text-blue-700">hello@couture.ai</a>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <Building2 className="w-6 h-6 text-gray-900 mb-4" />
              <h3 className="font-medium text-gray-900 mb-1">Office</h3>
              <p className="text-sm text-gray-500 mb-4">Come say hello at our HQ.</p>
              <p className="text-sm font-medium text-gray-800">100 Fashion Avenue<br/>New York, NY 10001</p>
            </div>
          </div>
          <div className="md:col-span-3 bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm">
            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 fill-emerald-500/10" />
                </div>
                <h3 className="font-display font-medium text-xl text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">Thank you for reaching out to Couture AI. One of our specialists will contact you shortly.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">First name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Last name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                  <textarea 
                    rows={4} 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors text-sm resize-none" 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Vision() {
  return (
    <div className="flex-1 bg-gray-50 h-full overflow-y-auto w-full">
      <PageHeader title="Our Vision" subtitle="A manifesto for the future of digital and physical apparel." />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <img src={fashionCollection[25]?.thumbnail || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600"} alt="Vision" className="w-full h-80 object-cover rounded-2xl mb-12 shadow-lg" referrerPolicy="no-referrer" />
        <div className="prose prose-gray max-w-none ml-auto mr-auto md:w-3/4">
          <p className="text-xl md:text-2xl text-gray-900 font-display leading-relaxed mb-10">We envision a world where the friction between imagination and realization is zero. Where sustainable, hyper-personalized luxury is available on demand.</p>
          <p className="text-gray-600 mb-6">Historically, fashion has operated on long lead times, massive waste profiles, and localized trend bubbles. Our mission is to compress cycle times down to minutes, while simultaneously opening up the creative surface area.</p>
          <div className="my-10 border-l-4 border-gray-900 pl-6 py-2">
            <p className="text-lg font-medium text-gray-800 italic">"The atelier of the future is natively digital, globally aware, and infinitely scalable."</p>
          </div>
          <p className="text-gray-600">By 2030, we aim to power the creative operations of 50% of the world's independent fashion houses, significantly reducing physical sampling waste and driving a new era of computational creativity.</p>
        </div>
      </div>
    </div>
  );
}

export function Careers() {
  const [selectedJob, setSelectedJob] = useState<{ role: string; team: string; loc: string } | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [applyForm, setApplyForm] = useState({ fullName: '', email: '', portfolio: '', coverLetter: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setAppliedJobs(prev => [...prev, selectedJob.role]);
      setApplyForm({ fullName: '', email: '', portfolio: '', coverLetter: '' });
    }, 1500);
  };

  return (
    <div className="flex-1 bg-gray-50 h-full overflow-y-auto w-full relative">
      <PageHeader title="Careers" subtitle="Help us build the next generation of creative tools." />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-display font-medium text-gray-900 mb-4">Life at Couture.AI</h2>
            <p className="text-gray-600 mb-6">We are a small, highly technical team obsessed with design, machine learning, and human-computer interaction. We offer competitive equity, uncapped wellness benefits, and a remote-first culture rooted in deep asynchronous work.</p>
          </div>
          <img src={fashionCollection[35]?.thumbnail || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"} alt="Team" className="rounded-2xl shadow-md w-full h-64 object-cover" referrerPolicy="no-referrer" />
        </div>
        
        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400 mb-8 border-b border-gray-200 pb-4">Open Roles</h3>
        <div className="space-y-4">
          {[
            { role: 'Senior Machine Learning Engineer (Diffusion)', team: 'Engineering', loc: 'Remote (US/EU)' },
            { role: 'Product Designer', team: 'Design', loc: 'New York / Remote' },
            { role: 'Fashion Data Analyst', team: 'Data', loc: 'Paris / Remote' }
          ].map((job, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedJob(job)}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between cursor-pointer"
            >
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-1">{job.role}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.team}</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {job.loc}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex items-center text-sm font-semibold text-gray-900">
                {appliedJobs.includes(job.role) ? (
                  <span className="text-emerald-600 flex items-center gap-1"><Star className="w-4 h-4 fill-emerald-500/10" /> Applied</span>
                ) : (
                  <>Apply <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Application Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedJob(null); setSubmitSuccess(false); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative z-10 border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setSelectedJob(null); setSubmitSuccess(false); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 fill-emerald-500/10 text-emerald-500" />
                  </div>
                  <h3 className="font-display font-medium text-xl text-gray-900 mb-2">Application Submitted!</h3>
                  <p className="text-gray-500 text-sm mb-6">Your application for the <strong>{selectedJob.role}</strong> position has been received. Our talent acquisition team will review and respond shortly.</p>
                  <button 
                    onClick={() => { setSelectedJob(null); setSubmitSuccess(false); }}
                    className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Back to Listings
                  </button>
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{selectedJob.team} • {selectedJob.loc}</span>
                  <h3 className="font-display font-semibold text-xl text-gray-900 mt-1 mb-6">Apply for {selectedJob.role}</h3>

                  <form onSubmit={handleApplySubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={applyForm.fullName}
                        onChange={(e) => setApplyForm(p => ({ ...p, fullName: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white text-sm" 
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={applyForm.email}
                        onChange={(e) => setApplyForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white text-sm" 
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Portfolio or GitHub Link</label>
                      <input 
                        type="url" 
                        required
                        value={applyForm.portfolio}
                        onChange={(e) => setApplyForm(p => ({ ...p, portfolio: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white text-sm" 
                        placeholder="https://portfolio.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Short Cover Note</label>
                      <textarea 
                        rows={3} 
                        value={applyForm.coverLetter}
                        onChange={(e) => setApplyForm(p => ({ ...p, coverLetter: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:bg-white text-sm resize-none" 
                        placeholder="Tell us briefly why you want to join Couture AI..."
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-400 mt-2 cursor-pointer"
                    >
                      {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Legal() {
  return (
    <div className="flex-1 bg-white h-full overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 prose prose-sm md:prose-base prose-gray">
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-gray-900 mb-8 pb-8 border-b border-gray-100">Terms of Service & Privacy</h1>
        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] mb-8">Last Updated: June 2026</p>
        
        <h3>1. Terms of Use</h3>
        <p>By accessing the Couture AI platform, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
        
        <h3>2. Intellectual Property Rights for Generated Assets</h3>
        <p>Unless restricted by a specific enterprise agreement, you retain commercial rights to any designs, images, and patterns generated utilizing the Couture AI pro tools. We claim no ownership over your generated outputs.</p>
        
        <h3>3. Data Privacy</h3>
        <p>We believe your data is your competitive advantage. Brand archives uploaded to your private workspace are never used to train our base global models without explicit opt-in. We employ enterprise-grade encryption for all stored assets.</p>
        
        <h3>4. Limitation of Liability</h3>
        <p>In no event shall Couture AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Couture AI's website.</p>
      </div>
    </div>
  );
}

export function Changelog() {
  return (
    <div className="flex-1 bg-gray-50 h-full overflow-y-auto w-full">
      <PageHeader title="Changelog" subtitle="New updates and improvements to Couture AI." />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="space-y-12">
          <div className="relative pl-8 md:pl-0">
            <div className="md:flex gap-10">
              <div className="md:w-1/4 mb-4 md:mb-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">OCT 14, 2023</span>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">v2.4.0</div>
              </div>
              <div className="md:w-3/4 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-display font-medium text-gray-900 mb-4">Semantic Search & Heatmaps</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2"><Star className="w-4 h-4 text-emerald-500 shrink-0" /> Added natural language searching to your generated design history.</li>
                  <li className="flex gap-2"><Star className="w-4 h-4 text-emerald-500 shrink-0" /> Introduced global Origin Heatmaps in the Trend Radar tab.</li>
                  <li className="flex gap-2"><Workflow className="w-4 h-4 text-blue-500 shrink-0" /> Added predictive trend alerts based on emerging aesthetic momentum.</li>
                  <li className="flex gap-2"><Workflow className="w-4 h-4 text-blue-500 shrink-0" /> Added new layout templates (Grid, Minimal) for PDF moodboard exports.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="relative pl-8 md:pl-0">
            <div className="md:flex gap-10">
              <div className="md:w-1/4 mb-4 md:mb-0">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">SEP 22, 2023</span>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">v2.3.1</div>
              </div>
              <div className="md:w-3/4 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-xl font-display font-medium text-gray-900 mb-4">Core Generation Upgrades</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2"><Star className="w-4 h-4 text-emerald-500 shrink-0" /> Upgraded the base generative model, improving fabric texture fidelity by 40%.</li>
                  <li className="flex gap-2"><HelpCircle className="w-4 h-4 text-amber-500 shrink-0" /> Fixed a bug where exporting large compare matrices would cause a crash.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Company() {
  return (
    <div className="flex-1 bg-gray-50 h-full overflow-y-auto w-full">
      <PageHeader title="Our Company" subtitle="A multi-disciplinary team bridging Silicon Valley and Paris." />
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl font-display font-medium text-gray-900 mb-6">Built for Creators</h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            We are backed by leading venture capital firms and strategic fashion conglomerates. Since our inception, we have been fiercely dedicated to empowering the independent designer and streamlining enterprise workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">Enterprise Grade</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Top-tier security and privacy for your intellectual property.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
              <Workflow className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">Seamless Workflow</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Integrates directly into your existing tools and 3D modeling software.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">Global Infrastructure</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Sub-second generation latency anywhere in the world.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
