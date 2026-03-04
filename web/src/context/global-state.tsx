'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import {useSession} from 'next-auth/react'
import {useTheme} from 'next-themes'

export type UserPreferences = {
  theme?: string
  language?: string
  [key: string]: unknown
}

interface GlobalState {
  preferences: UserPreferences | null
  setPreferences: (preferences: UserPreferences | null) => void
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined)

const STORAGE_KEY = 'user-preferences'

export function GlobalStateProvider({children}: {children: ReactNode}) {
  const [preferences, setPreferencesState] = useState<UserPreferences | null>(
    null,
  )
  const {data: session} = useSession()
  const prevSessionRef = useRef(session)
  const {setTheme} = useTheme()
  const themeInitializedRef = useRef(false)
  const loadedFromStorageRef = useRef(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !loadedFromStorageRef.current) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const storedPreferences = JSON.parse(stored) as UserPreferences
          // Use setTimeout to defer state update and avoid synchronous setState in effect
          setTimeout(() => {
            setPreferencesState(storedPreferences)

            // Initialize theme from stored preferences
            if (storedPreferences?.theme && !themeInitializedRef.current) {
              setTheme(storedPreferences.theme)
              themeInitializedRef.current = true
            }
          }, 0)
        }
        loadedFromStorageRef.current = true
      } catch (error) {
        console.error('Error loading preferences from storage:', error)
      }
    }
  }, [setTheme])

  // Sync preferences from session to global state when session changes
  // Only if we haven't loaded from localStorage yet
  useEffect(() => {
    if (session !== prevSessionRef.current && !loadedFromStorageRef.current) {
      prevSessionRef.current = session
      const sessionPreferences = session?.user?.preferences
        ? (session.user.preferences as UserPreferences)
        : null
      // Use setTimeout to defer state update and avoid synchronous setState in effect
      setTimeout(() => {
        setPreferencesState(sessionPreferences)

        // Initialize theme from preferences when session loads
        if (sessionPreferences?.theme && !themeInitializedRef.current) {
          setTheme(sessionPreferences.theme)
          themeInitializedRef.current = true
        }
      }, 0)
    }
  }, [session, setTheme])

  // Save preferences to browser storage when they change
  const setPreferences = useCallback(
    (newPreferences: UserPreferences | null) => {
      // Check if preferences actually changed before updating
      const hasChanged =
        JSON.stringify(preferences) !== JSON.stringify(newPreferences)

      // Update local state immediately
      setPreferencesState(newPreferences)

      // Save to localStorage if preferences changed
      if (hasChanged && typeof window !== 'undefined') {
        try {
          if (newPreferences === null) {
            localStorage.removeItem(STORAGE_KEY)
          } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
          }
        } catch (error) {
          console.error('Error saving preferences to storage:', error)
        }
      }
    },
    [preferences],
  )

  return (
    <GlobalStateContext.Provider value={{preferences, setPreferences}}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext)
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  return context
}