import {Injectable} from "@nestjs/common";
import {UserType, BaseUserType, SafeUser} from "shared";
import {UserService} from "./user.service.js";
import {JwtService} from "@nestjs/jwt";


@Injectable()
export class AuthService {
    constructor(private readonly userService: UserService,
                private readonly jwtService: JwtService,){}

    async register(user:UserType){
        const userRegister = await this.userService.register(user);
        const access_token = this.generateAccessToken(userRegister)
        return { access_token };
    }

    async login(user:BaseUserType){
        const userLogin = await this.userService.login(user);
        const access_token = this.generateAccessToken(userLogin)
        return { access_token };
    }

    async generateAccessToken(user: SafeUser){
        return await this.jwtService.signAsync({
            name: user.name,
            role: user.role,
            restaurant: user.restaurant,
        });
    }
}