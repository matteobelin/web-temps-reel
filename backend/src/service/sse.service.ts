import { concat, defer, finalize, from, interval, map, merge, mergeMap, Subject } from "rxjs";
import { Role, type OrderOutputType } from "shared";
import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

type OrderEvent = { id?: string; data: OrderOutputType };

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

    constructor(@Optional() private readonly prisma?: PrismaService) {}

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

    stream(role: Role, restaurantCode: string, lastEventId?: string) {
        return defer(() => {
            const channels = this.getOrCreate(restaurantCode);
            channels.subscribers++;
            const heartbeat = interval(15000).pipe(map(() => ({ comment: "keep-alive" })));
            const live = merge(channels[role].asObservable(), heartbeat);
            const stream = this.prisma && lastEventId
                ? concat(
                    from(this.replay(role, restaurantCode, lastEventId)).pipe(
                        mergeMap((events) => from(events)),
                    ),
                    live,
                )
                : live;
            return stream.pipe(
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

    emit(role: Role, restaurantCode: string, data: OrderOutputType, id?: string) {
        this.getOrCreate(restaurantCode)[role].next({ id, data });
    }

    emitMany(roles: Role[], restaurantCode: string, data: OrderOutputType, id?: string) {
        roles.forEach((role) => {
            this.emit(role, restaurantCode, data, id);
        });
    }

    private async replay(role: Role, restaurantCode: string, lastEventId?: string): Promise<OrderEvent[]> {
        if (!this.prisma || !lastEventId || !/^\d+$/.test(lastEventId)) return [];
        const events = await this.prisma.outboxEvent.findMany({
            where: { id: { gt: Number(lastEventId) }, restaurantCode },
            orderBy: { id: "asc" },
            take: 100,
        });
        return events
            .filter((event) => Array.isArray(event.roles) && event.roles.includes(role))
            .map((event) => ({
                id: String(event.id),
                data: event.payload as unknown as OrderOutputType,
            }));
    }
}