import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/auth-store';
import { IS_DEMO_MODE } from '../../utils/constants';

const loginSchema = z.object({
  email: z.string().email('Email invalide').min(1, 'L\'email est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      await login(data.email, data.password);
    } catch {
// error intentionally ignored (used for setLoginError only)
      setLoginError('Une erreur est survenue lors de la connexion');
    }
  };
  
  const loginAsDemo = async (role: 'admin' | 'user') => {
    setLoginError(null);
    try {
      if (role === 'admin') {
        await login('admin@rhdp.ci', 'password');
      } else {
        await login('user@rhdp.ci', 'password');
      }
    } catch {
// error intentionally ignored (used for setLoginError only)
      setLoginError('Une erreur est survenue lors de la connexion');
    }
  };
  
  return (
    <div className="animate-fade-in">
      <h2 className="mb-6 text-center text-xl font-bold text-neutral-900">
        Connectez-vous à votre compte
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          fullWidth
          error={errors.email?.message}
          {...register('email')}
        />
        
        <Input
          label="Mot de passe"
          type="password"
          fullWidth
          error={errors.password?.message}
          {...register('password')}
        />
        
        {loginError && (
          <div className="text-sm text-error">
            {loginError}
          </div>
        )}
        
        <div>
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
          >
            Se connecter
          </Button>
        </div>
      </form>
      
      {IS_DEMO_MODE && (
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-4">Connexion rapide (Mode démo)</h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => loginAsDemo('admin')}
              disabled={isLoading}
            >
              Connexion en tant qu'Administrateur
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => loginAsDemo('user')}
              disabled={isLoading}
            >
              Connexion en tant qu'Utilisateur
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;