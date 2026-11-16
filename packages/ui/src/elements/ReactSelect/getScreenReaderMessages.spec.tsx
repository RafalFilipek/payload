import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { ReactSelect } from './index.js'

const translations: Record<string, string> = {
  'general:selectGuidanceInput':
    '{{label}}: wpisz tekst, żeby zawęzić listę, strzałka w dół ją otwiera.',
  'general:selectResults': 'Liczba wyników: {{count}}.',
  'general:selectSelected': 'Wybrano: {{label}}.',
}

vi.mock('../../providers/Translation/index.js', () => {
  const t = (key: string, vars: Record<string, unknown> = {}) =>
    (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name]))

  return {
    useTranslation: () => ({
      i18n: { fallbackLanguage: 'en', language: 'pl', t, translations: {} },
      t,
    }),
  }
})

const options = [
  { label: 'Czerwony', value: 'red' },
  { label: 'Niebieski', value: 'blue' },
]

test('should announce select guidance, results and selection in the admin language', async () => {
  await render(
    <ReactSelect aria-label="Kolor" onChange={vi.fn()} options={options} value={undefined} />,
  )

  document.querySelector<HTMLInputElement>('.react-select input')?.focus()

  await expect
    .element(page.getByText('Kolor: wpisz tekst, żeby zawęzić listę, strzałka w dół ją otwiera.'))
    .toBeInTheDocument()

  await userEvent.keyboard('{ArrowDown}')
  await expect.element(page.getByText('Liczba wyników: 2.')).toBeInTheDocument()

  await userEvent.keyboard('{Enter}')
  await expect.element(page.getByText('Wybrano: Czerwony.')).toBeInTheDocument()
})
