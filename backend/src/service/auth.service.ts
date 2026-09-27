import {Injectable} from "@nestjs/common";
import {type UserInputRegistrationType, type UserOutputType, type UserInputType} from "shared";
import {UserService} from "./user.service.js";
import {JwtService} from "@nestjs/jwt";


@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService,){}

    async register(user:UserInputRegistrationType){
        const userRegister = await this.userService.register(user);
        const access_token = await this.generateAccessToken(userRegister)
        return { access_token, userRegister };
    }

    async login(user:UserInputType){
        const userLogin = await this.userService.login(user);
        const access_token = await this.generateAccessToken(userLogin)
        return { access_token, userLogin };
    }

    async generateAccessToken(user: UserOutputType){
        return await this.jwtService.signAsync({
            matricule: user.matricule,
            role: user.role,
            restaurantCode: user.restaurantCode,
        });
    }
}