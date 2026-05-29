import { ValidationError } from 'class-validator';
import { describe, expect, it } from '@jest/globals';
import {
  createValidationExceptionBody,
  flattenValidationErrors,
} from './validation-errors.util';

describe('validation-errors.util', () => {
  it('flattens multiple top-level field errors', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: { isEmail: 'email must be an email' },
      },
      {
        property: 'password',
        constraints: {
          isNotEmpty: 'password should not be empty',
          minLength: 'password must be longer than or equal to 8 characters',
        },
      },
    ] as ValidationError[];

    expect(flattenValidationErrors(errors)).toEqual({
      email: ['email phải là email hợp lệ'],
      password: [
        'password không được để trống',
        'password phải có ít nhất 8 ký tự',
      ],
    });
  });

  it('flattens nested object and array field errors', () => {
    const errors: ValidationError[] = [
      {
        property: 'options',
        children: [
          {
            property: '0',
            children: [
              {
                property: 'content',
                constraints: { isNotEmpty: 'content should not be empty' },
              },
            ],
          },
        ],
      },
    ] as ValidationError[];

    expect(flattenValidationErrors(errors)).toEqual({
      'options.0.content': ['options.0.content không được để trống'],
    });
  });

  it('creates a stable validation exception body', () => {
    const errors: ValidationError[] = [
      {
        property: 'options',
        children: [
          {
            property: '0',
            children: [
              {
                property: 'content',
                constraints: { isNotEmpty: 'content should not be empty' },
              },
            ],
          },
        ],
      },
    ] as ValidationError[];

    expect(createValidationExceptionBody(errors)).toEqual({
      errorCode: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ',
      fieldErrors: {
        'options.0.content': ['options.0.content không được để trống'],
      },
      details: ['options.0.content không được để trống'],
    });
  });

  it('translates common class-validator constraints', () => {
    const errors: ValidationError[] = [
      {
        property: 'id',
        constraints: { isUUID: 'id must be a UUID' },
      },
      {
        property: 'isActive',
        constraints: { isBoolean: 'isActive must be a boolean value' },
      },
      {
        property: 'orderIndex',
        constraints: {
          isInt: 'orderIndex must be an integer number',
          min: 'orderIndex must not be less than 0',
          max: 'orderIndex must not be greater than 100',
        },
      },
      {
        property: 'items',
        constraints: {
          isArray: 'items must be an array',
          arrayMinSize: 'items must contain at least 1 elements',
        },
      },
      {
        property: 'status',
        constraints: {
          isIn: 'status must be one of the following values: active, inactive',
        },
      },
    ] as ValidationError[];

    expect(flattenValidationErrors(errors)).toEqual({
      id: ['id phải là UUID hợp lệ'],
      isActive: ['isActive phải là boolean'],
      orderIndex: [
        'orderIndex phải là số nguyên',
        'orderIndex phải lớn hơn hoặc bằng 0',
        'orderIndex phải nhỏ hơn hoặc bằng 100',
      ],
      items: ['items phải là mảng', 'items phải có ít nhất 1 phần tử'],
      status: ['status phải là một trong các giá trị hợp lệ'],
    });
  });
});
