import type { TFunction } from '@payloadcms/translations'
import type { AriaLiveMessages, GroupBase } from 'react-select'

import type { Option } from './types.js'

type ScreenReaderMessages = {
  ariaLiveMessages: AriaLiveMessages<Option, boolean, GroupBase<Option>>
  screenReaderStatus: (state: { count: number }) => string
}

/**
 * react-select announces focus, selection, filtering and keyboard help in English only.
 * These messages follow its defaults, translated with the admin language.
 */
export const getScreenReaderMessages = ({ t }: { t: TFunction }): ScreenReaderMessages => {
  const getPosition = ({ item, list }: { item: Option; list?: readonly Option[] }) =>
    list?.length
      ? t('general:selectPosition', { count: list.length, index: list.indexOf(item) + 1 })
      : ''

  return {
    ariaLiveMessages: {
      guidance: ({ 'aria-label': ariaLabel, context, isInitialFocus }) => {
        switch (context) {
          case 'input':
            return isInitialFocus
              ? t('general:selectGuidanceInput', { label: ariaLabel || t('general:select') })
              : ''
          case 'menu':
            return t('general:selectGuidanceMenu')
          case 'value':
            return t('general:selectGuidanceValue')
          default:
            return ''
        }
      },
      onChange: ({ action, isDisabled, label = '', labels }) => {
        switch (action) {
          case 'clear':
            return t('general:selectCleared')
          case 'deselect-option':
          case 'pop-value':
          case 'remove-value':
            return t('general:selectDeselected', { label })
          case 'initial-input-focus':
            return t('general:selectSelected', { label: labels.join(', ') })
          case 'select-option':
            return isDisabled
              ? t('general:selectDisabledOption', { label })
              : t('general:selectSelected', { label })
          default:
            return ''
        }
      },
      onFilter: ({ inputValue, resultsMessage }) =>
        inputValue
          ? t('general:selectResultsFor', { query: inputValue, results: resultsMessage })
          : resultsMessage,
      onFocus: ({
        context,
        focused,
        isAppleDevice,
        isDisabled,
        isSelected,
        label = '',
        options,
        selectValue,
      }) => {
        if (context === 'value' && selectValue) {
          return t('general:selectFocusedValue', {
            label,
            position: getPosition({ item: focused, list: selectValue }),
          })
        }

        if (context === 'menu' && isAppleDevice) {
          const status = [
            isSelected && t('general:selectOptionSelected'),
            isDisabled && t('general:selectOptionDisabled'),
          ].filter(Boolean)

          return `${[label, ...status, getPosition({ item: focused, list: options })].join(', ')}.`
        }

        return ''
      },
    },
    screenReaderStatus: ({ count }) => t('general:selectResults', { count }),
  }
}
