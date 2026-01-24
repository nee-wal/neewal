import { Session, User } from '@supabase/supabase-js';
import React from 'react';


type AuthContextType = {
    session: Session | null;
    user: User | null;
    isGuest: boolean;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    loginAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;