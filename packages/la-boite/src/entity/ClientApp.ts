import { Entity, Column, PrimaryColumn } from "typeorm";
import { User } from './User'

@Entity()
export class ClientApp {

    @PrimaryColumn()
    id: string

    @Column()
    name: string

    @Column({ type: "json", default: [] })
    users: User[]
}