'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader as Loader2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface SavedProfile {
  id: string;
  name: string;
  nickname: string | null;
  birth_date: string;
  birth_time: string;
  birth_city: string;
  birth_country: string;
  is_primary: boolean;
}

export interface BirthDataFormData {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  personalContext: string;
}

interface BirthDataFormProps {
  onSubmit: (data: BirthDataFormData) => void;
  isLoading?: boolean;
  showPartnerFields?: boolean;
}

export function BirthDataForm({ onSubmit, isLoading = false, showPartnerFields = false }: BirthDataFormProps) {
  const [formData, setFormData] = useState<BirthDataFormData>({
    name: '',
    email: '',
    birthDate: '',
    birthTime: '',
    birthCity: '',
    birthCountry: '',
    personalContext: '',
  });

  const [partnerData, setPartnerData] = useState<Partial<BirthDataFormData>>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthCity: '',
    birthCountry: '',
  });

  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  useEffect(() => {
    loadSavedProfiles();
  }, []);

  const loadSavedProfiles = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUserEmail(session.user.email || '');

        const { data, error } = await supabase
          .from('birth_profiles')
          .select('*')
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSavedProfiles(data);

          const primaryProfile = data.find(p => p.is_primary);
          if (primaryProfile) {
            loadProfileData(primaryProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadProfileData = (profile: SavedProfile) => {
    setFormData({
      ...formData,
      name: profile.name,
      email: userEmail || formData.email,
      birthDate: profile.birth_date,
      birthTime: profile.birth_time,
      birthCity: profile.birth_city,
      birthCountry: profile.birth_country,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {savedProfiles.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <Label className="text-sm font-medium mb-3 block">Cargar Perfil Guardado</Label>
          <div className="flex flex-wrap gap-2">
            {savedProfiles.map((profile) => (
              <Button
                key={profile.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadProfileData(profile)}
                className="border-blue-500/30 hover:bg-blue-500/20"
              >
                <User className="w-4 h-4 mr-2" />
                {profile.nickname || profile.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Tus Datos de Nacimiento</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
              placeholder="Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthTime">Hora de Nacimiento *</Label>
            <Input
              id="birthTime"
              type="time"
              value={formData.birthTime}
              onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <p className="text-xs text-gray-400">La hora exacta es crucial para tu ascendente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birthCity">Ciudad de Nacimiento *</Label>
            <Input
              id="birthCity"
              value={formData.birthCity}
              onChange={(e) => setFormData({ ...formData, birthCity: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
              placeholder="Buenos Aires"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthCountry">País de Nacimiento *</Label>
            <Input
              id="birthCountry"
              value={formData.birthCountry}
              onChange={(e) => setFormData({ ...formData, birthCountry: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
              placeholder="Argentina"
            />
          </div>
        </div>

        {!showPartnerFields && (
          <div className="space-y-2">
            <Label htmlFor="personalContext">Contexto Personal (Opcional)</Label>
            <Textarea
              id="personalContext"
              value={formData.personalContext}
              onChange={(e) => setFormData({ ...formData, personalContext: e.target.value })}
              className="bg-white/5 border-white/10 text-white min-h-[100px]"
              placeholder="Comparte cualquier pregunta específica o área de tu vida que te gustaría explorar..."
            />
          </div>
        )}
      </div>

      {showPartnerFields && (
        <div className="space-y-4 pt-6 border-t border-white/10">
          <h3 className="text-xl font-semibold">Datos de tu Pareja</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partnerName">Nombre de tu Pareja *</Label>
              <Input
                id="partnerName"
                value={partnerData.name}
                onChange={(e) => setPartnerData({ ...partnerData, name: e.target.value })}
                required={showPartnerFields}
                className="bg-white/5 border-white/10 text-white"
                placeholder="María García"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerBirthDate">Fecha de Nacimiento *</Label>
              <Input
                id="partnerBirthDate"
                type="date"
                value={partnerData.birthDate}
                onChange={(e) => setPartnerData({ ...partnerData, birthDate: e.target.value })}
                required={showPartnerFields}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partnerBirthTime">Hora de Nacimiento *</Label>
              <Input
                id="partnerBirthTime"
                type="time"
                value={partnerData.birthTime}
                onChange={(e) => setPartnerData({ ...partnerData, birthTime: e.target.value })}
                required={showPartnerFields}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partnerBirthCity">Ciudad de Nacimiento *</Label>
              <Input
                id="partnerBirthCity"
                value={partnerData.birthCity}
                onChange={(e) => setPartnerData({ ...partnerData, birthCity: e.target.value })}
                required={showPartnerFields}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Madrid"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partnerBirthCountry">País de Nacimiento *</Label>
            <Input
              id="partnerBirthCountry"
              value={partnerData.birthCountry}
              onChange={(e) => setPartnerData({ ...partnerData, birthCountry: e.target.value })}
              required={showPartnerFields}
              className="bg-white/5 border-white/10 text-white"
              placeholder="España"
            />
          </div>

          <div className="space-y-2 pt-4">
            <Label htmlFor="relationshipContext">Contexto de la Relación *</Label>
            <Textarea
              id="relationshipContext"
              value={formData.personalContext}
              onChange={(e) => setFormData({ ...formData, personalContext: e.target.value })}
              required={showPartnerFields}
              className="bg-white/5 border-white/10 text-white min-h-[120px]"
              placeholder="Por favor, comparte el contexto real de la relación: ¿Están juntos? ¿Es un vínculo complicado? ¿Qué quieres entender? Cuanto más específico seas, más preciso será tu informe."
            />
            <p className="text-xs text-amber-400/80">
              Este contexto es fundamental para personalizar tu análisis de sinastría
            </p>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Procesando...
          </>
        ) : (
          'Continuar al Pago'
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Al continuar, aceptas nuestros términos de servicio y política de privacidad.
        Tu pago es seguro y procesado mediante Mercado Pago.
      </p>
    </form>
  );
}
