import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class ClientApp {

    @PrimaryColumn()
    id: string;

    @Column()
    name: string;
}