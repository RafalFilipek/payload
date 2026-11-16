import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { ReactSelect } from './index.js'

vi.mock('../../providers/Translation/index.js', () => {
  const t = (key: string) => key

  return {
    useTranslation: () => ({
      i18n: { fallbackLanguage: 'en', language: 'pl', t, translations: {} },
      t,
    }),
  }
})

const options = [
  { label: { en: 'Red', pl: 'Czerwony' }, value: 'red' },
  { label: { en: 'Blue', pl: 'Niebieski' }, value: 'blue' },
]

test('should show and search translated option labels in the admin language', async () => {
  await render(
    <ReactSelect aria-label="Colour" onChange={vi.fn()} options={options} value={undefined} />,
  )

  document.querySelector<HTMLInputElement>('.react-select input')?.focus()
  await userEvent.keyboard('Czer')

  await expect.element(page.getByRole('option', { name: 'Czerwony' })).toBeInTheDocument()
  await expect.element(page.getByRole('option', { name: 'Niebieski' })).not.toBeInTheDocument()
})
