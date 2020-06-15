export type XArcgisFormFieldType = 'input' | 'select' | 'radio' | 'checkbox' | 'textarea';

export interface XArcgisFormOption {
  label: string;
  value: string | number;
}

export type XArcgisFormOptions = XArcgisFormOption[];

export type XArcgisCheckboxValue = Pick<XArcgisFormOption, 'value'>[];

// tslint:disable-next-line:no-any
export abstract class XArcgisFormField<T = any> {
  /**
   * field value
   */
  value?: T;

  /**
   * field key
   * The key used to query the corresponding value in the results of the form
   */
  key: string;

  /**
   * Label of the control, used to show the user what the meaning of this form control
   */
  label: string;

  /**
   * Represent whether the control value must be set
   */
  required?: boolean;

  /**
   * Display order in a form. Controls will display ascending by this value
   */
  order?: number;

  /**
   * control type
   */
  abstract controlType: XArcgisFormFieldType;

  /**
   * type value for the template of the control
   * e.g.
   * for a input control, type should be: text, number, button e.t.c;
   */
  type?: string;

  /**
   * options for the template of the control
   * e.g. select form control
   */
  options?: XArcgisFormOptions;

  constructor(
    options: {
      value?: T;
      key?: string;
      label?: string;
      required?: boolean;
      order?: number;
      controlType?: XArcgisFormFieldType;
      type?: string;
    } = {}
  ) {
    this.value = options.value;
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.order = options.order === undefined ? 1 : options.order;
    this.type = options.type || '';
  }
}

export class XArcgisInputFormField extends XArcgisFormField<string> {
  controlType: XArcgisFormFieldType = 'input';

  type: string;

  constructor(options: {} = {}) {
    super(options);

    this.type = options['type'] || '';
  }
}

export class XArcgisSelectFormField extends XArcgisFormField<string> {
  controlType: XArcgisFormFieldType = 'select';

  options: XArcgisFormOptions = [];

  constructor(options: {} = {}) {
    super(options);
    this.options = options['options'] || [];
  }
}

export class XArcgisRadioFormField extends XArcgisFormField<number | boolean | string> {
  controlType: XArcgisFormFieldType = 'radio';

  options: XArcgisFormOptions = [];

  constructor(options: {} = {}) {
    super(options);
    this.options = options['options'] || [];
  }
}

/**
 * output result is an array which item is the value of the selected option;
 */
export class XArcgisCheckboxFormField extends XArcgisFormField<XArcgisCheckboxValue> {
  controlType: XArcgisFormFieldType = 'checkbox';

  options: XArcgisFormOptions = [];

  constructor(options: {} = {}) {
    super(options);
    this.options = options['options'] || [];
    this.value = options['value'] || [];
  }
}

export class XArcgisTextareaFormField extends XArcgisFormField<boolean> {
  controlType: XArcgisFormFieldType = 'textarea';

  constructor(options: {} = {}) {
    super(options);
  }
}
