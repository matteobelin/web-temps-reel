import {ConflictException, Injectable, NotFoundException, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../../prisma/prisma.service.js";
import {type UserInputRegistrationType, type UserInputType, type UserOutputType} from "shared";
import * as bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.js";

const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.GxJb2mQkX9yYw7vQ8dJ9Z0Zc1eWa";

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService){}

    async register(user: UserInputRegistrationType): Promise<UserOutputType> {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { code: user.restaurantCode },
        });
        if (!restaurant) {
            throw new NotFoundException("Restaurant not found");
        }

        const password = await bcrypt.hash(user.password, 10);

        try {
            const created = await this.prisma.user.create({
                data: {
                    name: user.name,
                    matricule: user.matricule,
                    role: user.role,
                    password,
                    restaurantId: restaurant.id,
                },
                select: { matricule: true, name: true, role: true },
            });

            return {
                ...created,
                restaurantCode: restaurant.code,
                restaurantName: restaurant.name,
            };
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new ConflictException("Matricule already used");
            }
            throw e;
        }
    }

    async login({ matricule, password, restaurantCode }: UserInputType): Promise<UserOutputType> {
        const foundUser = await this.prisma.user.findFirst({
            where: {
                matricule,
                restaurant: { code: restaurantCode },
            },
            include: { restaurant: true },
        });

        const isValid = await bcrypt.compare(password, foundUser?.password ?? DUMMY_HASH);
        if (!foundUser || !isValid) {
            throw new UnauthorizedException("Identifiants invalides.");
        }

        return {
            matricule: foundUser.matricule,
            name: foundUser.name,
            role: foundUser.role,
            restaurantCode: foundUser.restaurant.code,
            restaurantName: foundUser.restaurant.name,
        };
    }
}