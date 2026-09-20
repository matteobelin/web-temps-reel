import { Subject } from "rxjs";
import { Role } from "shared";
import {Injectable} from "@nestjs/common";

@Injectable()
export class SseService {
    private readonly channels = new Map<
        string,
        {
            COOK: Subject<any>;
            WAITER: Subject<any>;
            MANAGER: Subject<any>;
        }
    >();

    private getOrCreate(restaurantCode: string) {
        if (!this.channels.has(restaurantCode)) {
            this.channels.set(restaurantCode, {
                COOK: new Subject<any>(),
                WAITER: new Subject<any>(),
                MANAGER: new Subject<any>(),
            });
        }

        return this.channels.get(restaurantCode)!;
    }

    stream(role: Role, restaurantCode: string) {
        return this.getOrCreate(restaurantCode)[role].asObservable();
    }

    emit(role: Role, restaurantCode: string, data: any) {
        this.getOrCreate(restaurantCode)[role].next({ data });
    }

    emitMany(roles: Role[], restaurantCode: string, data: any) {
        roles.forEach((role) => {
            this.emit(role, restaurantCode, data);
        });
    }
}