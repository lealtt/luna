export interface IValidator<T> {
  setNext(validator: IValidator<T>): IValidator<T>;
  validate(item: T): void;
}

export abstract class BaseValidator<T> implements IValidator<T> {
  private next?: IValidator<T>;

  public setNext(validator: IValidator<T>): IValidator<T> {
    this.next = validator;
    return validator;
  }

  public validate(item: T): void {
    this.execute(item);
    if (this.next) {
      this.next.validate(item);
    }
  }

  protected abstract execute(item: T): void;
}
