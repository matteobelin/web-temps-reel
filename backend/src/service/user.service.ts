import {ConflictException, Injectable, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../../prisma/prisma.service.js";
import {UserType, BaseUserType} from "shared";
import * as bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.js";


@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService){}

    async register(user:UserType){
        try{
            const hashedPassword = await bcrypt.hash(user.password, 10);
            this.prisma.user.create({
                data: {
                    ...user,
                    password: hashedPassword,
                },
            });
        }
        catch (error){
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
            ) {
                throw new ConflictException("Name already used");
            }
            throw Error
        }
    }

    async login(user:BaseUserType){
        const foundUser = await this.prisma.user.findFirst({
            where: { name: user.name },
        });
        if (!foundUser) {
            throw new UnauthorizedException("Identifiants invalides.");
        }

        const isValid = await bcrypt.compare(user.password, foundUser.password);
        if (!isValid) {
            throw new UnauthorizedException("Identifiants invalides.");
        }
        return { name: foundUser.name, password: foundUser.password, role: foundUser.role} as UserType;
    }
}