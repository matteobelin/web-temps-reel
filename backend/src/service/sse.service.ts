import { Subject } from "rxjs";
import { Role } from "shared";
import {Injectable} from "@nestjs/common";

@Injectable()
export class SseService {
    private readonly channels = new Map<
        number,
        {
            COOK: Subject<any>;
            WAITER: Subject<any>;
            MANAGER: Subject<any>;
        }
    >();

    private getOrCreate(restaurantId: number) {
        if (!this.channels.has(restaurantId)) {
            this.channels.set(restaurantId, {
                COOK: new Subject<any>(),
                WAITER: new Subject<any>(),
                MANAGER: new Subject<any>(),
            });
        }

        return this.channels.get(restaurantId)!;
    }

    stream(role: Role, restaurantId: number) {
        return this.getOrCreate(restaurantId)[role].asObservable();
    }

    emit(role: Role, restaurantId: number, data: any) {
        this.getOrCreate(restaurantId)[role].next({ data });
    }

    emitMany(roles: Role[], restaurantId: number, data: any) {
        roles.forEach((role) => {
            this.emit(role, restaurantId, data);
        });
    }
}