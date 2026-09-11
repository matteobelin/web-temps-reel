import {Injectable} from "@nestjs/common";
import {UserType, BaseUserType} from "shared";
import {UserService} from "./user.service.js";
import {JwtService} from "@nestjs/jwt";


@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService,){}

    async register(user:UserType){
        await this.userService.register(user);
        const access_token = this.generateAccessToken(user)
        return { access_token };
    }

    async login(user:BaseUserType){
        const userLogin = await this.userService.login(user);
        const access_token = this.generateAccessToken(userLogin)
        return { access_token };
    }

    async generateAccessToken(user: UserType){
        return await this.jwtService.signAsync({
            name: user.name,
            role: user.role,
        });
    }
}