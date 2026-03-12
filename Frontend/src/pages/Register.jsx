import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITIES, YEARS } from '../utils/constants';
import toast from 'react-hot-toast';

const STEPS = ['Account', 'Academic', 'Done'];

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '',
    university: '', department: '', year: '',
  });
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const nextStep = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        toast.error('Please fill in all fields'); return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match'); return;
      }
      if (form.password.length < 8) {
        toast.error('Password must be at least 8 characters'); return;
      }
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!form.university) { toast.error('Please select your university'); return; }

    // Deeper validation before submission
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(form.password)) {
      toast.error('Password must contain uppercase, lowercase, and a number');
      return;
    }

    const { confirmPassword, ...data } = form;

    const submissionData = {
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      university: data.university.trim(),
      department: data.department ? data.department.trim() : undefined,
      year: data.year ? Number(data.year) : undefined
    };

    const result = await register(submissionData);
    if (result.success) {
      toast.success('Account created! Welcome to UniShare 🎓');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'Registration failed');
      const lowerMsg = (result.message || '').toLowerCase();
      if (lowerMsg.includes('password') || lowerMsg.includes('email')) {
        setStep(1);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎓</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>UniShare</span>
          </Link>
          <h1 style={{ color: '#F1F5F9', fontFamily: "'Syne', sans-serif", fontSize: 26, marginTop: 20, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>Join thousands of students sharing resources</p>
        </div>

        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 20, padding: 32 }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 4, borderRadius: 2, background: i + 1 <= step ? 'linear-gradient(90deg, #0EA5E9, #6366F1)' : '#334155', marginBottom: 6, transition: 'background 0.3s' }} />
                <span style={{ color: i + 1 <= step ? '#0EA5E9' : '#64748B', fontSize: 11 }}>{s}</span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input name="firstName" value={form.firstName} onChange={handle} placeholder="Alex" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input name="lastName" value={form.lastName} onChange={handle} placeholder="Chen" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handle} placeholder="you@university.edu" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" name="password" value={form.password} onChange={handle} placeholder="Min. 8 characters" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} placeholder="Repeat password" style={inputStyle} />
              </div>
              <button onClick={nextStep} style={btnStyle}>Continue →</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>University *</label>
                <select name="university" value={form.university} onChange={handle} style={inputStyle}>
                  <option value="">Select your university</option>
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Department</label>
                <input name="department" value={form.department} onChange={handle} placeholder="e.g. Computer Science" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year of Study</label>
                <select name="year" value={form.year} onChange={handle} style={inputStyle}>
                  <option value="">Select year</option>
                  {YEARS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ ...btnStyle, background: 'transparent', border: '1px solid #334155', color: '#94A3B8', flex: 1 }}>← Back</button>
                <button onClick={submit} disabled={isLoading} style={{ ...btnStyle, flex: 2 }}>
                  {isLoading ? 'Creating account...' : 'Create Account 🚀'}
                </button>
              </div>
            </div>
          )}

          <p style={{ color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '11px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" };
const labelStyle = { color: '#94A3B8', fontSize: 13, marginBottom: 8, display: 'block' };
const btnStyle = { background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', border: 'none', borderRadius: 12, padding: '13px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' };
