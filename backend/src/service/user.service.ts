import {ConflictException, Injectable, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../../prisma/prisma.service.js";
import {UserType, BaseUserType, Role, SafeUser} from "shared";
import * as bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.js";


@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService){}

    async register(user:UserType){
        try{
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { name: user.restaurant },
            });

            if (!restaurant) {
                throw new Error("Restaurant not found");
            }
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const userCreated = await this.prisma.user.create({
                data: {
                    name: user.name,
                    role: user.role as Role,
                    password: hashedPassword,
                    restaurantId: restaurant.id,
                },
            });
            return {
                id: userCreated.id,
                name: userCreated.name,
                role: userCreated.role,
                restaurant: userCreated.restaurantId,
            } as SafeUser;
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
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { name: user.restaurant },
        });

        const foundUser = await this.prisma.user.findFirst({
            where: {
                name: user.name,
                restaurantId: restaurant?.id,
            },
            include: {
                restaurant: true,
            },
        });
        if (!foundUser) {
            throw new UnauthorizedException("Identifiants invalides.");
        }

        const isValid = await bcrypt.compare(user.password, foundUser.password);
        if (!isValid) {
            throw new UnauthorizedException("Identifiants invalides.");
        }
        return {
            id: foundUser.id,
            name: foundUser.name,
            role: foundUser.role,
            restaurant: foundUser.restaurant.id,
        } as SafeUser;
    }
}