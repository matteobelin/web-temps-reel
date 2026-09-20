import { ZodType, z } from "zod";
import { BadRequestException, PipeTransform } from "@nestjs/common";

export class ZodValidationPipe<S extends ZodType> implements PipeTransform<unknown, z.output<S>> {
    constructor(private schema: S) {}

    transform(value: unknown): z.output<S> {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            throw new BadRequestException(z.flattenError(result.error));
        }
        return result.data;
    }
}