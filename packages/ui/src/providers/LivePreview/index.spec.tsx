import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { useLivePreviewContext } from './context.js'
import { LivePreviewProvider } from './index.js'

const translations: Record<string, string> = {
  'general:responsive': 'Dopasuj do okna',
}

vi.mock('../../providers/Translation/index.js', () => {
  const t = (key: string) => translations[key] ?? key

  return {
    useTranslation: () => ({ i18n: { language: 'pl', t }, t }),
  }
})

vi.mock('../../hooks/usePopupWindow.js', () => ({
  usePopupWindow: () => ({
    isPopupOpen: false,
    openPopupWindow: vi.fn(),
    popupRef: { current: null },
  }),
}))

vi.mock('../../providers/DocumentInfo/index.js', () => ({
  useDocumentInfo: () => ({ collectionSlug: 'pages' }),
}))

vi.mock('../../providers/Preferences/index.js', () => ({
  usePreferences: () => ({ setPreference: vi.fn() }),
}))

const BreakpointLabels = () => {
  const { breakpoints } = useLivePreviewContext()

  return (
    <ul>
      {breakpoints.map((breakpoint) => (
        <li key={breakpoint.name}>{breakpoint.label}</li>
      ))}
    </ul>
  )
}

test('should label the built-in responsive breakpoint in the admin language', async () => {
  await render(
    <LivePreviewProvider isLivePreviewing={false} typeofLivePreviewURL="string" url="">
      <BreakpointLabels />
    </LivePreviewProvider>,
  )

  await expect.element(page.getByText('Dopasuj do okna')).toBeInTheDocument()
})
