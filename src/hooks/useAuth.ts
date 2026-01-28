import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    // Generate a 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the OTP temporarily (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    localStorage.setItem('passwordResetOtp', JSON.stringify({ 
      email, 
      code: otpCode, 
      expiresAt 
    }));

    // Send custom email with OTP via edge function
    const { error: emailError } = await supabase.functions.invoke('send-password-reset', {
      body: { email, otpCode }
    });

    if (emailError) {
      return { error: emailError };
    }

    return { error: null };
  };

  const verifyOtp = async (email: string, token: string) => {
    // Verify against our stored OTP
    const stored = localStorage.getItem('passwordResetOtp');
    if (!stored) {
      return { data: null, error: { message: 'No reset request found. Please request a new code.' } };
    }

    const { email: storedEmail, code, expiresAt } = JSON.parse(stored);
    
    if (storedEmail !== email) {
      return { data: null, error: { message: 'Email mismatch. Please request a new code.' } };
    }

    if (new Date() > new Date(expiresAt)) {
      localStorage.removeItem('passwordResetOtp');
      return { data: null, error: { message: 'Code has expired. Please request a new code.' } };
    }

    if (code !== token) {
      return { data: null, error: { message: 'Invalid code. Please check and try again.' } };
    }

    // Mark as verified for password update
    localStorage.setItem('passwordResetVerified', JSON.stringify({ email, verified: true }));
    localStorage.removeItem('passwordResetOtp');
    
    return { data: { verified: true }, error: null };
  };

  const updatePassword = async (newPassword: string) => {
    // Check if user was verified via OTP
    const verified = localStorage.getItem('passwordResetVerified');
    if (!verified) {
      return { error: { message: 'Please verify your email first.' } };
    }

    const { email } = JSON.parse(verified);
    
    // Call edge function to update password using admin API
    const { data, error } = await supabase.functions.invoke('update-password', {
      body: { email, newPassword }
    });
    
    if (error) {
      return { error };
    }

    localStorage.removeItem('passwordResetVerified');
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    verifyOtp,
    updatePassword,
  };
};
