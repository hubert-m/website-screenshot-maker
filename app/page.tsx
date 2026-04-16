'use client';

import { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

  const [formData, setFormData] = useState({
    url: '',
    width: 1920,
    height: 1080,
    fullPage: true,
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
    <div className="w-full flex flex-col items-center p-6 relative">
      {/* Decorative background elements with Parallax */}
      <motion.div 
        style={{ y: y1 }}
        className="fixed top-[-10%] left-[-10%] w-[60%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full -z-10"
      ></motion.div>
      <motion.div 
        style={{ y: y2 }}
        className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full -z-10"
      ></motion.div>

      <div className="max-w-xl w-full z-10 pt-12 sm:pt-24 flex-shrink-0">
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
                  autoComplete="off"
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
                  autoComplete="off"
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
                  autoComplete="off"
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
      </div>

      {/* SEO Content Section - Wider Container */}
      <div className="w-full max-w-6xl z-10 px-4 mt-12 mb-24">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-3xl -z-10 rounded-full"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                Najlepsze narzędzie do <span className="text-indigo-400">zrzutów ekranu</span> online
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Nasz Website Screenshot Maker wykorzystuje najnowszą technologię Puppeteer, aby zapewnić najdokładniejsze odwzorowanie stron internetowych. 
                Idealne dla designerów, deweloperów i marketerów.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-sm font-medium">Auto-Scroll</span>
                <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">Cookie Bypass</span>
                <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium">HD Quality</span>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Automatyczny scroll",
                  desc: "Nasz skrypt inteligentnie przewija każdą stronę, aby wyzwolić mechanizmy \"lazy loading\". Dzięki temu na zrzucie zobaczysz wszystkie obrazy i sekcje."
                },
                {
                  title: "Omijanie banerów Cookies",
                  desc: "Wspieramy automatyczne klikanie w popularne banery zgód na pliki cookies. Zrzuty są czyste i pozbawione zbędnych nakładek."
                },
                {
                  title: "Pełna wysokość strony",
                  desc: "Opcja \"Cała strona\" pozwala na uchwycenie witryny od nagłówka aż po stopkę w jednym, wysokiej jakości pliku graficznym."
                },
                {
                  title: "Wysoka jakość JPG/PNG",
                  desc: "Wybierz format pliku dostosowany do potrzeb – bezstratny PNG dla precyzji lub lekki JPG dla oszczędności miejsca."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass-panel p-6 rounded-2xl hover:border-indigo-500/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
