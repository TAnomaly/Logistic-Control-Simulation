/**
 * GetGatesQuery - Kapı listesi sorgulama query'si
 */
export class GetGatesQuery {
    constructor(
        public readonly page: number = 1,
        public readonly limit: number = 10,
        public readonly gateType?: string,
        public readonly isActive?: boolean,
        public readonly locationName?: string,
    ) { }
} 