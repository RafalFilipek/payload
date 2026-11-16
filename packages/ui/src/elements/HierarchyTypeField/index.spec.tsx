import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'

import { HierarchyTypeField } from './index.js'

const translations: Record<string, string> = {
  'hierarchy:allowedTypesDescription': 'Wybierz typy kolekcji, które może zawierać ten element',
}

vi.mock('../../providers/Translation/index.js', () => {
  const t = (key: string) => translations[key] ?? key

  return {
    useTranslation: () => ({ i18n: { language: 'pl', t }, t }),
  }
})

vi.mock('../../providers/Hierarchy/index.js', () => ({
  useHierarchy: () => ({ allowedCollections: [] }),
}))

vi.mock('../../forms/useField/index.js', () => ({
  useField: () => ({ customComponents: {}, path: 'folderType', setValue: vi.fn(), value: null }),
}))

vi.mock('../../fields/Select/index.js', () => ({
  formatOptions: (options: unknown[]) => options,
  SelectInput: ({ description }: { description: string }) => <p>{description}</p>,
}))

test('should show the allowed types description in the admin language', async () => {
  await render(
    <HierarchyTypeField
      field={{ name: 'folderType', options: [], type: 'select' }}
      options={[]}
      parentFieldName="folder"
      path="folderType"
    />,
  )

  await expect
    .element(page.getByText('Wybierz typy kolekcji, które może zawierać ten element'))
    .toBeInTheDocument()
})
