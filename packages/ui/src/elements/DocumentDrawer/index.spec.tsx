import type { ClientConfig } from 'payload'

import { ModalProvider } from '@faceless-ui/modal'
import { enTranslations } from '@payloadcms/translations/languages/en'
import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { ServerFunctionsContextType } from '../../providers/ServerFunctions/index.js'

import { ConfigProvider } from '../../providers/Config/index.js'
import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { ServerFunctionsContext } from '../../providers/ServerFunctions/index.js'
import { TranslationProvider } from '../../providers/Translation/index.js'
import { DocumentDrawerToggler } from './index.js'

const config = {
  collections: [
    {
      slug: 'pages',
      labels: {
        plural: { en: 'Pages', pl: 'Strony' },
        singular: { en: 'Page', pl: 'Strona' },
      },
    },
  ],
  globals: [],
} as unknown as ClientConfig

test.each([
  { expectedLabel: 'Add new Page', operation: 'create' as const },
  { expectedLabel: 'Edit Page', operation: 'update' as const },
])(
  'should translate a localized collection label in the $operation toggler aria-label',
  async ({ expectedLabel, operation }) => {
    const screen = await render(
      <RouterAdapterContext
        value={{
          Link: ({ href, ...props }) => <a href={href} {...props} />,
          params: {},
          pathname: '/',
          router: { back: vi.fn(), push: vi.fn(), refresh: vi.fn(), replace: vi.fn() },
          searchParams: new URLSearchParams(),
        }}
      >
        <ServerFunctionsContext value={{} as ServerFunctionsContextType}>
          <TranslationProvider
            dateFNSKey="en-US"
            fallbackLang="en"
            language="en"
            languageOptions={[{ label: 'English', value: 'en' }]}
            translations={enTranslations}
          >
            <ConfigProvider config={config}>
              <ModalProvider transTime={0}>
                <DocumentDrawerToggler
                  collectionSlug="pages"
                  drawerSlug="doc-drawer_pages"
                  operation={operation}
                >
                  Toggle
                </DocumentDrawerToggler>
              </ModalProvider>
            </ConfigProvider>
          </TranslationProvider>
        </ServerFunctionsContext>
      </RouterAdapterContext>,
    )

    await expect.element(screen.getByRole('button', { name: expectedLabel })).toBeVisible()
  },
)
