import { pl } from 'date-fns/locale/pl'
import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import DatePicker from './DatePicker.js'

const translations: Record<string, string> = {
  'general:selectValue': 'Wybierz wartość',
  'general:time': 'Czas',
}

vi.mock('../../providers/Translation/index.js', () => {
  const t = (key: string) => translations[key] ?? key

  return {
    useTranslation: () => ({
      i18n: {
        dateFNS: pl,
        dateFNSKey: 'pl',
        fallbackLanguage: 'en',
        language: 'pl',
        t,
        translations: {},
      },
      t,
    }),
  }
})

test('should show the calendar and its time caption in the admin language', async () => {
  await render(
    <DatePicker
      pickerAppearance="dayAndTime"
      placeholder="Date"
      value={new Date(Date.UTC(2026, 10, 16, 12))}
    />,
  )

  await page.getByPlaceholder('Date').click()

  await expect.element(page.getByText('pon', { exact: true })).toBeVisible()
  await expect.element(page.getByText('Czas', { exact: true })).toBeInTheDocument()
})
