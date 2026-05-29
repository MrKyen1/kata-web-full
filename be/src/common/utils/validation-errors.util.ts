import { ValidationError } from 'class-validator';
import { FieldErrors } from '../types/error-response.type';

export interface ValidationExceptionBody {
  errorCode: 'VALIDATION_ERROR';
  message: 'Dữ liệu không hợp lệ';
  fieldErrors: FieldErrors;
  details: string[];
}

export function createValidationExceptionBody(
  errors: ValidationError[],
): ValidationExceptionBody {
  const fieldErrors = flattenValidationErrors(errors);

  return {
    errorCode: 'VALIDATION_ERROR',
    message: 'Dữ liệu không hợp lệ',
    fieldErrors,
    details: Object.entries(fieldErrors).flatMap(([field, messages]) =>
      messages.map((message) => formatDetailedMessage(field, message)),
    ),
  };
}

export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldErrors {
  return errors.reduce<FieldErrors>((result, error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const messages = Object.entries(error.constraints ?? {}).map(
      ([constraint, message]) =>
        translateValidationMessage(path, constraint, message),
    );

    if (messages.length > 0) {
      result[path] = [...(result[path] ?? []), ...messages];
    }

    if (error.children?.length) {
      const childErrors = flattenValidationErrors(error.children, path);
      for (const [childPath, childMessages] of Object.entries(childErrors)) {
        result[childPath] = [...(result[childPath] ?? []), ...childMessages];
      }
    }

    return result;
  }, {});
}

function translateValidationMessage(
  field: string,
  constraint: string,
  message: string,
) {
  const numberValue = message.match(/\d+/)?.[0];

  switch (constraint) {
    case 'whitelistValidation':
      return `${field} không được phép xuất hiện`;
    case 'isNotEmpty':
      return `${field} không được để trống`;
    case 'isDefined':
      return `${field} là bắt buộc`;
    case 'isString':
      return `${field} phải là chuỗi`;
    case 'isEmail':
      return `${field} phải là email hợp lệ`;
    case 'isUUID':
      return `${field} phải là UUID hợp lệ`;
    case 'isBoolean':
      return `${field} phải là boolean`;
    case 'isInt':
      return `${field} phải là số nguyên`;
    case 'isNumber':
      return `${field} phải là số`;
    case 'isArray':
      return `${field} phải là mảng`;
    case 'isDateString':
      return `${field} phải là chuỗi ngày hợp lệ`;
    case 'isEnum':
    case 'isIn':
      return `${field} phải là một trong các giá trị hợp lệ`;
    case 'min':
      return `${field} phải lớn hơn hoặc bằng ${numberValue ?? 'giá trị tối thiểu'}`;
    case 'max':
      return `${field} phải nhỏ hơn hoặc bằng ${numberValue ?? 'giá trị tối đa'}`;
    case 'minLength':
      return `${field} phải có ít nhất ${numberValue ?? 'số'} ký tự`;
    case 'maxLength':
      return `${field} không được vượt quá ${numberValue ?? 'số'} ký tự`;
    case 'arrayMinSize':
      return `${field} phải có ít nhất ${numberValue ?? 'một'} phần tử`;
    case 'arrayMaxSize':
      return `${field} không được vượt quá ${numberValue ?? 'số'} phần tử`;
    case 'nestedValidation':
      return `${field} phải là object hợp lệ`;
    default:
      return translateKnownDefaultMessage(field, message);
  }
}

function translateKnownDefaultMessage(field: string, message: string) {
  if (message.includes('should not exist')) {
    return `${field} không được phép xuất hiện`;
  }
  if (message.includes('should not be empty')) {
    return `${field} không được để trống`;
  }
  if (message.includes('must be an email')) {
    return `${field} phải là email hợp lệ`;
  }
  if (message.includes('must be a UUID')) {
    return `${field} phải là UUID hợp lệ`;
  }
  if (message.includes('must be a boolean value')) {
    return `${field} phải là boolean`;
  }
  if (message.includes('must be an integer number')) {
    return `${field} phải là số nguyên`;
  }
  if (message.includes('must be an array')) {
    return `${field} phải là mảng`;
  }
  if (message.includes('must be a string')) {
    return `${field} phải là chuỗi`;
  }

  return `${field} không hợp lệ`;
}

function formatDetailedMessage(field: string, message: string) {
  const leafField = field.split('.').at(-1);

  if (message.startsWith(`${field} `)) return message;
  if (leafField && message.startsWith(`${leafField} `)) {
    return `${field} ${message.slice(leafField.length + 1)}`;
  }

  return `${field}: ${message}`;
}
