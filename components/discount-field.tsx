'use client';

import { useState } from 'react';
import { Tag, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DiscountFieldProps {
  onDiscount: (percent: number) => void;
}

export function DiscountField({ onDiscount }: DiscountFieldProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'valid'|'invalid'>('idle');
  const [discountPercent, setDiscountPercent] = useState(0);

  async function applyCode() {
    if (!code.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setStatus('valid');
        setDiscountPercent(data.discountPercent);
        onDiscount(data.discountPercent);
      } else {
        setStatus('invalid');
        onDiscount(0);
      }
    } catch {
      setStatus('invalid');
    }
  }

  function removeCode() {
    setCode('');
    setStatus('idle');
    setDiscountPercent(0);
    onDiscount(0);
  }

  return (
    <div className='mt-4'>
      <div className='flex items-center gap-2 mb-2'>
        <Tag className='w-4 h-4 text-purple-400' />
        <span className='text-sm text-gray-400'>¿Tenés un código de descuento?</span>
      </div>
      {status === 'valid' ? (
        <div className='flex items-center justify-between p-3 rounded-xl border border-green-500/30 bg-green-500/10'>
          <div className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4 text-green-400' />
            <span className='text-sm text-green-300 font-medium'>
              Código <strong>{code.toUpperCase()}</strong> aplicado — {discountPercent}% de descuento
            </span>
          </div>
          <button onClick={removeCode} className='text-xs text-gray-500 hover:text-gray-300 transition-colors'>
            Quitar
          </button>
        </div>
      ) : (
        <div className='flex gap-2'>
          <input
            type='text'
            value={code}
            onChange={(e) => { setCode(e.target.value); setStatus('idle'); }}
            onKeyDown={(e) => e.key === 'Enter' && applyCode()}
            placeholder='CODIGO-DESCUENTO'
            className='flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-purple-500/50 uppercase'
          />
          <button
            onClick={applyCode}
            disabled={status === 'loading' || !code.trim()}
            className='px-4 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-500/30 text-white text-sm font-medium transition-all disabled:opacity-50'
          >
            {status === 'loading' ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Aplicar'}
          </button>
        </div>
      )}
      {status === 'invalid' && (
        <div className='flex items-center gap-2 mt-2'>
          <XCircle className='w-4 h-4 text-red-400' />
          <span className='text-xs text-red-400'>Código inválido o expirado</span>
        </div>
      )}
    </div>
  );
}