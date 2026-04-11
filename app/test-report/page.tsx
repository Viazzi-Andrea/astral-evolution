'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle } from 'lucide-react';

interface BirthData {
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  personalContext?: string;
}

export default function TestReportPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [reportId, setReportId] = useState('');
  const [productSlug, setProductSlug] = useState('lectura-esencial');

  const [birthData, setBirthData] = useState<BirthData>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthCity: '',
    birthCountry: '',
    personalContext: '',
  });

  const [partnerData, setPartnerData] = useState<BirthData>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthCity: '',
    birthCountry: '',
    personalContext: '',
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate required fields
      if (!birthData.name || !birthData.birthDate || !birthData.birthTime || !birthData.birthCity || !birthData.birthCountry) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // If it's a couples reading, validate partner data
      if (productSlug === 'especial-parejas' && (!partnerData.name || !partnerData.birthDate || !partnerData.birthTime)) {
        throw new Error('Por favor completa los datos de tu pareja');
      }

      // Call the test generation endpoint
      const response = await fetch('/api/test-generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productSlug,
          birthData,
          partnerData: productSlug === 'especial-parejas' ? partnerData : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el reporte');
      }

      setSuccess(true);
      setReportId(data.reportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-3xl text-white">Generador de Reporte de Prueba</CardTitle>
            <CardDescription className="text-gray-300">
              Esta página te permite generar reportes astrológicos de prueba sin pasar por el sistema de pagos.
              Usa esto mientras Paddle está en revisión para probar la integración con Gemini y Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product" className="text-white">Producto</Label>
              <Select value={productSlug} onValueChange={setProductSlug}>
                <SelectTrigger id="product" className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lectura-esencial">Lectura Esencial</SelectItem>
                  <SelectItem value="consulta-evolutiva">Consulta Evolutiva</SelectItem>
                  <SelectItem value="especial-parejas">Especial Parejas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Data Form */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Tus Datos de Nacimiento</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={birthData.name}
                    onChange={(e) => setBirthData({ ...birthData, name: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-white">Fecha de Nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthData.birthDate}
                    onChange={(e) => setBirthData({ ...birthData, birthDate: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthTime" className="text-white">Hora de Nacimiento *</Label>
                  <Input
                    id="birthTime"
                    type="time"
                    value={birthData.birthTime}
                    onChange={(e) => setBirthData({ ...birthData, birthTime: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthCity" className="text-white">Ciudad de Nacimiento *</Label>
                  <Input
                    id="birthCity"
                    value={birthData.birthCity}
                    onChange={(e) => setBirthData({ ...birthData, birthCity: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Ciudad de México"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthCountry" className="text-white">País de Nacimiento *</Label>
                  <Input
                    id="birthCountry"
                    value={birthData.birthCountry}
                    onChange={(e) => setBirthData({ ...birthData, birthCountry: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="México"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalContext" className="text-white">Contexto Personal (Opcional)</Label>
                <Textarea
                  id="personalContext"
                  value={birthData.personalContext}
                  onChange={(e) => setBirthData({ ...birthData, personalContext: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Describe tu situación actual, preguntas o áreas de interés..."
                  rows={3}
                />
              </div>
            </div>

            {/* Partner Data (only for couples reading) */}
            {productSlug === 'especial-parejas' && (
              <div className="space-y-4 pt-6 border-t border-white/20">
                <h3 className="text-xl font-semibold text-white">Datos de tu Pareja</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partnerName" className="text-white">Nombre Completo *</Label>
                    <Input
                      id="partnerName"
                      value={partnerData.name}
                      onChange={(e) => setPartnerData({ ...partnerData, name: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="María García"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerBirthDate" className="text-white">Fecha de Nacimiento *</Label>
                    <Input
                      id="partnerBirthDate"
                      type="date"
                      value={partnerData.birthDate}
                      onChange={(e) => setPartnerData({ ...partnerData, birthDate: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerBirthTime" className="text-white">Hora de Nacimiento *</Label>
                    <Input
                      id="partnerBirthTime"
                      type="time"
                      value={partnerData.birthTime}
                      onChange={(e) => setPartnerData({ ...partnerData, birthTime: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerBirthCity" className="text-white">Ciudad de Nacimiento *</Label>
                    <Input
                      id="partnerBirthCity"
                      value={partnerData.birthCity}
                      onChange={(e) => setPartnerData({ ...partnerData, birthCity: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Guadalajara"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partnerBirthCountry" className="text-white">País de Nacimiento *</Label>
                    <Input
                      id="partnerBirthCountry"
                      value={partnerData.birthCountry}
                      onChange={(e) => setPartnerData({ ...partnerData, birthCountry: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="México"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <Alert className="bg-red-500/20 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/20 border-green-500/50">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  ¡Reporte generado exitosamente! ID: {reportId}
                  <br />
                  El reporte se está generando en segundo plano. Verifica tu email o la base de datos.
                </AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando Reporte...
                </>
              ) : (
                'Generar Reporte de Prueba'
              )}
            </Button>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Instrucciones:</h4>
              <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                <li>Esta herramienta genera reportes sin pasar por Paddle</li>
                <li>Los reportes se guardan en Supabase como si fueran transacciones reales</li>
                <li>Usa esto para probar la integración con Gemini AI</li>
                <li>El estado de la transacción será marcado como &quot;completed&quot; automáticamente</li>
                <li>El código de descuento TEST100 (100% off) ya está creado en la base de datos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
