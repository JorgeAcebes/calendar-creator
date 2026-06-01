import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Heart, Smartphone, Coffee } from 'lucide-react';
import { DONATION_CONFIG } from '@/config/donations';

const Donate: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-ui)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--space-8)',
    }}>
      <div style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-8)' }}>
        <button
          className="btn btn--ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>

      <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), var(--color-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)',
          boxShadow: '0 8px 32px rgba(255, 55, 95, 0.3)'
        }}>
          <Heart size={32} color="#fff" />
        </div>
        
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', marginBottom: 'var(--space-3)' }}>
          Apoya el Proyecto
        </h1>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', lineHeight: 'var(--leading-relaxed)' }}>
          Tu donación nos ayuda a mantener y mejorar esta herramienta de forma gratuita. Elige el método que prefieras.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
          
          {/* Bizum */}
          <div className="glass-panel" style={{ padding: 'var(--space-5)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: '#00C3A0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="#000" />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Bizum</h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Instantáneo y sin comisiones desde tu móvil.</p>
            <button 
              className="btn" 
              style={{ width: '100%', background: '#00C3A0', borderColor: '#00C3A0', color: '#000', opacity: DONATION_CONFIG.bizumEnabled ? 1 : 0.5 }} 
              onClick={() => {
                if (!DONATION_CONFIG.bizumEnabled) return alert('Opción temporalmente deshabilitada.');
                window.open('bizum://', '_blank');
                navigator.clipboard.writeText(DONATION_CONFIG.bizumPhone);
                alert(`Número copiado al portapapeles: ${DONATION_CONFIG.bizumPhone}\n\nSi tienes la app de Bizum instalada, debería abrirse ahora.`);
              }}
            >
              Abrir Bizum y Copiar
            </button>
          </div>

          {/* Ko-fi */}
          <div className="glass-panel" style={{ padding: 'var(--space-5)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: '#FF5E5B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coffee size={20} color="#fff" />
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Ko-fi</h3>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Invítame a un café pagando con tarjeta o PayPal.</p>
            <button 
              className="btn" 
              style={{ width: '100%', background: '#FF5E5B', borderColor: '#FF5E5B', color: '#fff', opacity: DONATION_CONFIG.kofiEnabled ? 1 : 0.5 }} 
              onClick={() => {
                if (!DONATION_CONFIG.kofiEnabled) return alert('Opción temporalmente deshabilitada.');
                window.open(DONATION_CONFIG.kofiLink, '_blank');
              }}
            >
              Abrir Ko-fi
            </button>
          </div>

        </div>
        
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-8)' }}>
          Tus datos de pago se procesan de forma encriptada. El creador de la aplicación nunca tendrá acceso a tus datos financieros.
        </p>
      </div>
    </div>
  );
};

export default Donate;
