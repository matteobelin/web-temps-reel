import { defer, finalize, interval, map, merge, Subject } from "rxjs";
import { Role, type OrderOutputType } from "shared";
import {Injectable} from "@nestjs/common";

type OrderEvent = { data: OrderOutputType };

@Injectable()
export class SseService {
    private readonly channels = new Map<
        string,
        {
            COOK: Subject<OrderEvent>;
            WAITER: Subject<OrderEvent>;
            MANAGER: Subject<OrderEvent>;
            subscribers: number;
        }
    >();

    private getOrCreate(restaurantCode: string) {
        if (!this.channels.has(restaurantCode)) {
            this.channels.set(restaurantCode, {
                COOK: new Subject<OrderEvent>(),
                WAITER: new Subject<OrderEvent>(),
                MANAGER: new Subject<OrderEvent>(),
                subscribers: 0,
            });
        }

        return this.channels.get(restaurantCode)!;
    }

    stream(role: Role, restaurantCode: string) {
        return defer(() => {
            const channels = this.getOrCreate(restaurantCode);
            channels.subscribers++;
            const heartbeat = interval(15000).pipe(map(() => ({ comment: "keep-alive" })));
            return merge(channels[role].asObservable(), heartbeat).pipe(
                finalize(() => {
                    channels.subscribers--;
                    if (channels.subscribers === 0) {
                        channels.COOK.complete();
                        channels.WAITER.complete();
                        channels.MANAGER.complete();
                        this.channels.delete(restaurantCode);
                    }
                }),
            );
        });
    }

    emit(role: Role, restaurantCode: string, data: OrderOutputType) {
        this.getOrCreate(restaurantCode)[role].next({ data });
    }

    emitMany(roles: Role[], restaurantCode: string, data: OrderOutputType) {
        roles.forEach((role) => {
            this.emit(role, restaurantCode, data);
        });
    }
}