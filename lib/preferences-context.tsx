'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { type Locale, type Theme, type TranslationKey, translations } from './i18n'

interface PreferencesContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  t: (key: TranslationKey) => string
}

const PreferencesContext = createContext<PreferencesContextType | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const savedLocale = (localStorage.getItem('pump-locale') as Locale) || 'pt'
    const savedTheme = (localStorage.getItem('pump-theme') as Theme) || 'dark'
    setLocaleState(savedLocale)
    setThemeState(savedTheme)
    // Sync DOM (anti-flash script already did this, but re-confirm after hydration)
    document.documentElement.setAttribute('data-theme', savedTheme)
    document.documentElement.lang = savedLocale === 'pt' ? 'pt-BR' : savedLocale
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('pump-locale', newLocale)
    document.documentElement.lang = newLocale === 'pt' ? 'pt-BR' : newLocale
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('pump-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return (translations[locale] as Record<string, string>)[key]
      ?? (translations.pt as Record<string, string>)[key]
      ?? key
  }, [locale])

  return (
    <PreferencesContext.Provider value={{ locale, setLocale, theme, setTheme, t }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
