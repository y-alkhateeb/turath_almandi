// Form components barrel export

// NEW: forwardRef-based components that work with {...register('fieldName')} spread
// These are the RECOMMENDED components to use with react-hook-form
export {
  FormFieldInput,
  FormFieldTextarea,
  FormFieldSelect,
  FormFieldDate,
} from './FormField';
export type {
  FormFieldInputProps,
  FormFieldTextareaProps,
  FormFieldSelectProps,
  FormFieldDateProps,
  SelectOption,
} from './FormField';

// Legacy components (kept for backwards compatibility)
// Consider migrating to FormField* components
export { FormInput } from './FormInput';
export type { FormInputProps } from './FormInput';

export { FormSelect } from './FormSelect';
export type { FormSelectProps } from './FormSelect';

export { FormDatePicker } from './FormDatePicker';
export type { FormDatePickerProps } from './FormDatePicker';

export { DateInput } from './DateInput';

export { FormTextarea } from './FormTextarea';
export type { FormTextareaProps } from './FormTextarea';

export { FormCheckbox } from './FormCheckbox';
export type { FormCheckboxProps } from './FormCheckbox';

export { FormRadioGroup } from './FormRadioGroup';
export type { FormRadioGroupProps, RadioOption } from './FormRadioGroup';

export { BranchSelector } from './BranchSelector';
export type { BranchSelectorProps } from './BranchSelector';

export { ContactSelector } from './ContactSelector';
export type { ContactSelectorProps } from './ContactSelector';
