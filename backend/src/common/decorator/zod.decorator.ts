import { Body, Param, Query } from "@nestjs/common";
import type { ZodType } from "zod";
import { ZodValidationPipe } from "../pipes/zod-validation.pipe.js";

export const ZodBody = <S extends ZodType>(schema: S) =>
    Body(new ZodValidationPipe(schema));

export const ZodQuery = <S extends ZodType>(schema: S) =>
    Query(new ZodValidationPipe(schema));

export const ZodParam = <S extends ZodType>(schema: S) =>
    Param(new ZodValidationPipe(schema));