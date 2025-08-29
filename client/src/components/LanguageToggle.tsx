import { useLocale, type Locale } from '@/store/locale';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const language = useLocale(s => s.language);
  const setLanguage = useLocale(s => s.setLanguage);

  const next = (l: Locale) => () => setLanguage(l);

  return (
    <div className="inline-flex items-center gap-1">
      <Button size="sm" variant={language === 'en' ? 'default' : 'outline'} onClick={next('en')} data-testid="lang-en">
        EN
      </Button>
      <Button size="sm" variant={language === 'es' ? 'default' : 'outline'} onClick={next('es')} data-testid="lang-es">
        ES
      </Button>
    </div>
  );
}

