import { BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

function LoginScreen({
  isRegistering,
  showPassword,
  loginForm,
  onToggleRegistering,
  onToggleShowPassword,
  onSubmit,
  onChange,
}) {
  const MotionDiv = motion.div;

  return (
    <div className="login-container">
      <MotionDiv
        className="login-card glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="login-header">
          <BrainCircuit size={48} color="#3b82f6" />
          <h1>AVATIA</h1>
          <p>{isRegistering ? 'Crear nueva cuenta' : 'Asistente de Inteligencia Avanzada'}</p>
        </div>
        <form onSubmit={onSubmit} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="usuario@correo.com"
              value={loginForm.email}
              onChange={(event) => onChange('email', event.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(event) => onChange('password', event.target.value)}
                required
              />
              <button
                type="button"
                className="show-pass-btn"
                onClick={onToggleShowPassword}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn">
            {isRegistering ? 'Crear Cuenta' : 'Acceder al Sistema'}
          </button>
        </form>
        <div className="login-footer">
          <button className="toggle-auth-btn" onClick={onToggleRegistering}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </MotionDiv>
    </div>
  );
}

export default LoginScreen;
