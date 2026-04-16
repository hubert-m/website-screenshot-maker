'use client';

import { useState } from 'react';
import { 
  Globe, 
  Maximize2, 
  Minimize2, 
  Camera, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';

export default function Home() {
  const [formData, setFormData] = useState({
    url: '',
    width: 1920,
    height: 1080,
    fullPage: false,
    format: 'png',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Basic URL validation
    if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      setError('Adres URL musi zaczynać się od http:// lub https://');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Wystąpił błąd podczas generowania zrzutu.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot_${new Date().getTime()}.${formData.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value as string) : val
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>

      <div className="max-w-xl w-full z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
            <Camera className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Snapshot <span className="text-indigo-400">Maker</span>
          </h1>
          <p className="text-slate-400 text-lg">Uchwyć dowolną stronę w kilka sekund.</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Adres URL strony
              </label>
              <div className="relative group">
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com"
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white p-4 rounded-xl input-focus group-hover:border-slate-600 transition-colors"
                  value={formData.url}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Width */}
              <div className="space-y-2">
                <label htmlFor="width" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" /> Szerokość (px)
                </label>
                <input
                  id="width"
                  name="width"
                  type="number"
                  placeholder="1920"
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white p-4 rounded-xl input-focus"
                  value={formData.width}
                  onChange={handleInputChange}
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <label 
                  htmlFor="height" 
                  className={`text-sm font-medium flex items-center gap-2 transition-colors ${formData.fullPage ? 'text-slate-600' : 'text-slate-300'}`}
                >
                  <Minimize2 className="w-4 h-4" /> Wysokość (px)
                </label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  disabled={formData.fullPage}
                  className={`w-full p-4 rounded-xl input-focus transition-all duration-300 ${
                    formData.fullPage 
                      ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                      : 'bg-slate-800/50 border-slate-700/50 text-white'
                  }`}
                  value={formData.height}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Format Select */}
              <div className="w-full space-y-2">
                <label htmlFor="format" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Format pliku
                </label>
                <select
                  id="format"
                  name="format"
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white p-4 rounded-xl input-focus appearance-none cursor-pointer"
                  value={formData.format}
                  onChange={handleInputChange}
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>

              {/* Full Page Checkbox */}
              <div className="w-full flex items-center mt-6">
                <label className="relative flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="fullPage"
                    className="sr-only peer"
                    checked={formData.fullPage}
                    onChange={handleInputChange}
                  />
                  <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  <span className="text-sm font-medium text-slate-300">Cała strona</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">Zrzut został pomyślnie wygenerowany!</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full group flex items-center justify-center gap-3 p-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                isLoading 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generowanie...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  <span>Generuj i pobierz</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-slate-500 text-sm mt-8 pb-12">
          Przetwarzanie może potrwać kilka sekund w zależności od strony.
        </p>

        {/* SEO Content Section */}
        <div className="mt-16 sm:mt-24 space-y-16 max-w-4xl mx-auto px-4 py-16 border-t border-slate-800">
          <section className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Najlepsze narzędzie do zrzutów ekranu online</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Nasz Website Screenshot Maker wykorzystuje najnowszą technologię Puppeteer, aby zapewnić najdokładniejsze odwzorowanie stron internetowych.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Automatyczny scroll
              </h3>
              <p className="text-slate-400">
                Nasz skrypt inteligentnie przewija każdą stronę, aby wyzwolić mechanizmy "lazy loading". Dzięki temu na zrzucie zobaczysz wszystkie obrazy i sekcje, nie tylko te widoczne na początku.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Omijanie banerów Cookies
              </h3>
              <p className="text-slate-400">
                Wspieramy automatyczne klikanie w popularne banery zgód na pliki cookies (np. Cookiebot). Zrzuty są czyste i pozbawione zbędnych nakładek.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Pełna wysokość strony
              </h3>
              <p className="text-slate-400">
                Opcja "Cała strona" pozwala na uchwycenie witryny od nagłówka aż po stopkę w jednym, wysokiej jakości pliku graficznym.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Wysoka jakość JPG i PNG
              </h3>
              <p className="text-slate-400">
                Możesz wybrać format pliku dostosowany do Twoich potrzeb – bezstratny PNG dla precyzji lub lekki JPG dla oszczędności miejsca.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
