import type { ClientConfig, FormState } from 'payload'

import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ConfigProvider } from '../../providers/Config/index.js'
import { RouterAdapterContext } from '../../providers/RouterAdapter/index.js'
import { ServerFunctionsProvider } from '../../providers/ServerFunctions/index.js'
import { useForm } from './context.js'
import { Form } from './index.js'

// The real provider builds URLs from `process.env`, which does not exist in the browser test runner
vi.mock('../../providers/UploadHandlers/index.js', () => ({
  useUploadHandlers: () => ({ getUploadHandler: () => null }),
}))

type OnChange = (args: { formState: FormState; submitted?: boolean }) => Promise<FormState>

const config = {
  collections: [],
  globals: [],
  routes: { api: '/api' },
  serverURL: '',
} as unknown as ClientConfig

const router = {
  back: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
}

const initialState: FormState = {
  array: { initialValue: 0, rows: [], valid: true, value: 0 },
  title: { initialValue: 'initial', valid: true, value: 'initial' },
}

describe('Form onChange', () => {
  test('should send a field change made while an onChange request is pending', async () => {
    const { onChange, resolveFirstRequest } = createSlowFirstOnChange()
    const screen = await renderForm(onChange)

    await screen.getByRole('button', { name: 'Set title to A' }).click()
    await expect.poll(() => onChange.mock.calls.length).toBe(1)
    expect(onChange.mock.calls[0][0].formState.title.value).toBe('A')

    await screen.getByRole('button', { name: 'Set title to B' }).click()
    resolveFirstRequest({ title: { initialValue: 'initial', valid: true, value: 'A' } })

    await expect.poll(() => onChange.mock.calls.length).toBe(2)
    expect(onChange.mock.calls[1][0].formState.title.value).toBe('B')
  })

  test('should not send another request when nothing changed while the request was pending', async () => {
    const { onChange, resolveFirstRequest } = createSlowFirstOnChange()
    const screen = await renderForm(onChange)

    await screen.getByRole('button', { name: 'Set title to A' }).click()
    await expect.poll(() => onChange.mock.calls.length).toBe(1)

    resolveFirstRequest({ title: { initialValue: 'initial', valid: true, value: 'A' } })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('should send a row added while an onChange request is pending', async () => {
    const { onChange, resolveFirstRequest } = createSlowFirstOnChange()
    const screen = await renderForm(onChange)

    await screen.getByRole('button', { name: 'Set title to A' }).click()
    await expect.poll(() => onChange.mock.calls.length).toBe(1)

    await screen.getByRole('button', { name: 'Add row' }).click()
    resolveFirstRequest({
      array: { initialValue: 0, rows: [], valid: true, value: 0 },
      title: { initialValue: 'initial', valid: true, value: 'A' },
    })

    await expect.poll(() => onChange.mock.calls.length).toBe(2)
    expect(onChange.mock.calls[1][0].formState.array.rows).toHaveLength(1)
  })
})

/**
 * The first request stays pending until `resolveFirstRequest` is called,
 * every later request echoes the form state back immediately.
 */
function createSlowFirstOnChange() {
  let resolveFirstRequest: (serverState: FormState) => void

  const firstRequest = new Promise<FormState>((resolve) => {
    resolveFirstRequest = resolve
  })

  const onChange = vi.fn<OnChange>(({ formState }) =>
    onChange.mock.calls.length === 1 ? firstRequest : Promise.resolve(formState),
  )

  return { onChange, resolveFirstRequest: (state: FormState) => resolveFirstRequest(state) }
}

async function renderForm(onChange: OnChange) {
  return await render(
    <RouterAdapterContext
      value={{
        Link: (props) => <a {...props} />,
        params: {},
        pathname: '/',
        router,
        searchParams: new URLSearchParams(),
      }}
    >
      <ConfigProvider config={config}>
        <ServerFunctionsProvider serverFunction={vi.fn()}>
          <Form initialState={initialState} onChange={[onChange]}>
            <Controls />
          </Form>
        </ServerFunctionsProvider>
      </ConfigProvider>
    </RouterAdapterContext>,
  )
}

function Controls() {
  const { addFieldRow, dispatchFields, setModified } = useForm()

  const setTitle = (value: string) => {
    dispatchFields({ type: 'UPDATE', path: 'title', value })
    setModified(true)
  }

  return (
    <>
      <button onClick={() => setTitle('A')} type="button">
        Set title to A
      </button>
      <button onClick={() => setTitle('B')} type="button">
        Set title to B
      </button>
      <button onClick={() => addFieldRow({ path: 'array', schemaPath: 'array' })} type="button">
        Add row
      </button>
    </>
  )
}
