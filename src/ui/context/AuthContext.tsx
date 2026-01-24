import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState<boolean>(() => {
        return localStorage.getItem('isGuest') === 'true';
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            // If we have a session, we are definitely not a guest
            if (session) {
                setIsGuest(false);
                localStorage.removeItem('isGuest');
            }
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session) {
                setIsGuest(false);
                localStorage.removeItem('isGuest');
            }
            setLoading(false);
            console.log('Auth state changed:', _event, session?.user?.email);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error };
    };

    const loginAsGuest = async () => {
        setIsGuest(true);
        localStorage.setItem('isGuest', 'true');
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setIsGuest(false);
        localStorage.removeItem('isGuest');
    };

    const value = {
        session,
        user,
        isGuest,
        loading,
        signInWithEmail,
        signUpWithEmail,
        loginAsGuest,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
