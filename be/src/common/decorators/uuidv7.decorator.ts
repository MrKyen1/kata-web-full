import { PrimaryColumn, BeforeInsert } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

type EntityWithId = Record<string, string | undefined>;

export function Uuidv7PrimaryColumn() {
  return function (target: object, propertyKey: string) {
    Object.defineProperty(target, 'generateId', {
      value: function (this: EntityWithId) {
        if (!this[propertyKey]) {
          this[propertyKey] = uuidv7();
        }
      },
      enumerable: false,
      configurable: true,
      writable: true,
    });

    BeforeInsert()(target, 'generateId');
    PrimaryColumn({ type: 'uuid' })(target, propertyKey);
  };
}
