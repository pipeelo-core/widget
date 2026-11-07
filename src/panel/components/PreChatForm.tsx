import type { TargetedSubmitEvent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { WidgetUser } from '../../shared/protocol';
import type { PreChatFieldKey } from '../lib/pre-chat';
import { STR } from '../lib/strings';
import { formatUserField, normalizeUserField } from '../lib/user-fields';

const FIELD_ATTRS: Record<
  PreChatFieldKey,
  {
    label: string;
    error: string;
    type?: string;
    inputmode?: string;
    autocomplete: string;
    autocapitalize?: 'characters';
    spellcheck?: boolean;
    options?: { value: string; label: string }[];
  }
> = {
  name: { label: STR.preChatName, error: STR.preChatRequired, type: 'text', autocomplete: 'name' },
  email: {
    label: STR.preChatEmail,
    error: STR.preChatEmailInvalid,
    type: 'email',
    inputmode: 'email',
    autocomplete: 'email',
  },
  phone: {
    label: STR.preChatPhone,
    error: STR.preChatPhoneInvalid,
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
  },
  document: {
    label: STR.preChatDocument,
    error: STR.preChatDocumentInvalid,
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'characters',
    spellcheck: false,
  },
  gender: {
    label: STR.preChatGender,
    error: STR.preChatGenderRequired,
    autocomplete: 'sex',
    options: [
      { value: 'masculine', label: STR.preChatMasculine },
      { value: 'feminine', label: STR.preChatFeminine },
    ],
  },
  birthday: {
    label: STR.preChatBirthday,
    error: STR.preChatBirthdayInvalid,
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'bday',
  },
  country: {
    label: STR.preChatCountry,
    error: STR.preChatRequired,
    type: 'text',
    autocomplete: 'country-name',
  },
  state: {
    label: STR.preChatState,
    error: STR.preChatRequired,
    type: 'text',
    autocomplete: 'address-level1',
  },
  city: {
    label: STR.preChatCity,
    error: STR.preChatRequired,
    type: 'text',
    autocomplete: 'address-level2',
  },
  cep: {
    label: STR.preChatCep,
    error: STR.preChatCepInvalid,
    type: 'text',
    inputmode: 'numeric',
    autocomplete: 'postal-code',
  },
  street: {
    label: STR.preChatStreet,
    error: STR.preChatRequired,
    type: 'text',
    autocomplete: 'address-line1',
  },
  number: {
    label: STR.preChatNumber,
    error: STR.preChatRequired,
    type: 'text',
    autocomplete: 'off',
  },
  neighborhood: {
    label: STR.preChatNeighborhood,
    error: STR.preChatRequired,
    type: 'text',
    autocomplete: 'address-level3',
  },
};

const keepFocus = (event: Event) => event.preventDefault();

export function PreChatForm(props: {
  fields: PreChatFieldKey[];
  onSubmit(values: WidgetUser): void;
}) {
  const [values, setValues] = useState<Partial<Record<PreChatFieldKey, string>>>({});
  const [invalid, setInvalid] = useState<PreChatFieldKey[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      formRef.current?.querySelector<HTMLElement>('.prechat-input')?.focus();
    }
  }, []);

  const update = (field: PreChatFieldKey, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (invalid.includes(field) && normalizeUserField(field, value)) {
      setInvalid((current) => current.filter((item) => item !== field));
    }
  };

  const submit = (event: TargetedSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user: WidgetUser = {};
    for (const field of props.fields) {
      const value = normalizeUserField(field, values[field] ?? '');
      if (value) user[field] = value;
    }
    const rejected = props.fields.filter((field) => !user[field]);
    setInvalid(rejected);
    const first = rejected[0];
    if (first) {
      const input = event.currentTarget.elements.namedItem(first);
      if (input instanceof HTMLElement) input.focus();
    } else {
      props.onSubmit(user);
    }
  };

  return (
    <form ref={formRef} class="prechat" novalidate onSubmit={submit}>
      <div class="prechat-head">
        <p class="prechat-title">{STR.preChatTitle}</p>
        <p class="prechat-intro">{STR.preChatIntro}</p>
      </div>

      {props.fields.map((field) => {
        const attrs = FIELD_ATTRS[field];
        const flagged = invalid.includes(field);
        const className = 'prechat-input' + (flagged ? ' prechat-input--invalid' : '');
        return (
          <label class="prechat-field" key={field}>
            <span class="prechat-label">{attrs.label}</span>
            {attrs.options ? (
              <select
                class={className + ' prechat-select'}
                name={field}
                autocomplete={attrs.autocomplete}
                value={values[field] ?? ''}
                aria-invalid={flagged ? 'true' : undefined}
                onChange={(event) => update(field, event.currentTarget.value)}
              >
                <option value="">{STR.preChatSelect}</option>
                {attrs.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                class={className}
                name={field}
                type={attrs.type}
                inputmode={attrs.inputmode}
                autocomplete={attrs.autocomplete}
                autocapitalize={attrs.autocapitalize}
                spellcheck={attrs.spellcheck}
                maxlength={255}
                value={values[field] ?? ''}
                aria-invalid={flagged ? 'true' : undefined}
                onInput={(event) => update(field, event.currentTarget.value)}
                onChange={(event) =>
                  update(field, formatUserField(field, event.currentTarget.value))
                }
              />
            )}
            {flagged && (
              <span class="prechat-error" role="alert">
                {attrs.error}
              </span>
            )}
          </label>
        );
      })}

      <button type="submit" class="conv-new prechat-submit" onMouseDown={keepFocus}>
        {STR.preChatSubmit}
      </button>
    </form>
  );
}
